import { useEffect, useRef, useState } from 'react'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { LineaPeso } from '../../components/ui/LineaPeso'
import { MascotAvatar } from '../../components/ui/MascotAvatar'
import { PantallaFlujo } from '../../components/ui/PantallaFlujo'
import { repositorios } from '../../data'
import { claveDia, formatoDiaRelativo, sumarDias } from '../../domain/fechas'
import { formatoDecimal, formatoPeso } from '../../domain/formato'
import { LIMITES } from '../../domain/perfil'
import { LIMITES_REGISTRO, PASO_PESO_KG, type Peso } from '../../domain/registros'
import { imc } from '../../domain/reglas'
import { usePerfil } from '../perfil/contexto'

const SEMANAS = 6

type Carga = { fase: 'cargando' } | { fase: 'error' } | { fase: 'lista'; pesos: Peso[] }

/** Espera antes de que mantener pulsado empiece a repetir, y ritmo de la repetición. */
const ESPERA_REPETIR_MS = 400
const INTERVALO_REPETIR_MS = 80

/**
 * Un toque da un paso; mantener pulsado los repite. El teclado sigue usando `click`.
 * Sin esto, bajar 2 kg exigía 20 toques.
 */
function useSostener(accion: () => void) {
  const espera = useRef<number | undefined>(undefined)
  const intervalo = useRef<number | undefined>(undefined)
  const sostuvo = useRef(false)
  const accionActual = useRef(accion)
  useEffect(() => {
    accionActual.current = accion
  })

  const parar = () => {
    window.clearTimeout(espera.current)
    window.clearInterval(intervalo.current)
  }
  useEffect(() => parar, [])

  return {
    onPointerDown: () => {
      sostuvo.current = false
      espera.current = window.setTimeout(() => {
        sostuvo.current = true
        accionActual.current()
        intervalo.current = window.setInterval(() => accionActual.current(), INTERVALO_REPETIR_MS)
      }, ESPERA_REPETIR_MS)
    },
    onPointerUp: parar,
    onPointerLeave: parar,
    onPointerCancel: parar,
    onClick: () => {
      // El `click` que sigue a una pulsación larga ya está cubierto por las repeticiones.
      if (sostuvo.current) {
        sostuvo.current = false
        return
      }
      accionActual.current()
    },
  }
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-borde p-3 text-center">
      <div className="text-xs font-semibold text-tinta-3">{etiqueta}</div>
      <div className="text-lg font-extrabold">{valor}</div>
    </div>
  )
}

/** Registro del peso del día (design/Peso.dc.html). */
export function PesoPage() {
  useTitulo('Registrar peso')
  const { perfil } = usePerfil()
  const [hoy] = useState(() => claveDia(new Date()))
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })
  const [kg, setKg] = useState(perfil.plan?.datos.pesoKg ?? 70)
  const [nota, setNota] = useState('')
  const [fase, setFase] = useState<'editando' | 'guardando' | 'guardado' | 'fallo'>('editando')
  /** Texto mientras se escribe el peso a mano; null cuando manda el stepper. */
  const [escrito, setEscrito] = useState<string | null>(null)

  function mover(sentido: 1 | -1) {
    setFase('editando')
    setKg((actual) =>
      Math.min(Math.max(Math.round((actual + sentido * PASO_PESO_KG) * 10) / 10, LIMITES.pesoKg.min), LIMITES.pesoKg.max),
    )
  }
  const restar = useSostener(() => mover(-1))
  const sumar = useSostener(() => mover(1))

  useEffect(() => {
    let vigente = true
    repositorios.registros
      .obtenerPesos(sumarDias(hoy, -7 * SEMANAS))
      .then((pesos) => {
        if (!vigente) return
        const ultimo = pesos.at(-1)
        if (ultimo) setKg(ultimo.kg)
        const deHoy = pesos.find((peso) => peso.fecha === hoy)
        if (deHoy) setNota(deHoy.nota)
        setCarga({ fase: 'lista', pesos })
      })
      .catch(() => {
        if (vigente) setCarga({ fase: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [hoy])

  const datos = perfil.plan?.datos
  if (!datos) return null

  const pesos = carga.fase === 'lista' ? carga.pesos : []
  const anteriores = pesos.filter((peso) => peso.fecha < hoy)
  const ultimo = anteriores.at(-1)
  const cambio = ultimo ? Math.round((kg - ultimo.kg) * 10) / 10 : null
  const indice = imc(kg, datos.estaturaCm)
  const falta = Math.round(Math.abs(kg - datos.pesoMetaKg) * 10) / 10
  const serie = [...anteriores.map((peso) => peso.kg), kg]

  async function guardar() {
    setFase('guardando')
    try {
      await repositorios.registros.guardarPeso({ fecha: hoy, kg, nota: nota.trim() })
      setFase('guardado')
    } catch {
      setFase('fallo')
    }
  }

  function confirmarEscrito() {
    const valor = Number((escrito ?? '').replace(',', '.'))
    setEscrito(null)
    if (!Number.isFinite(valor) || valor <= 0) return
    const ajustado = Math.round(valor * 10) / 10
    setFase('editando')
    setKg(Math.min(Math.max(ajustado, LIMITES.pesoKg.min), LIMITES.pesoKg.max))
  }

  const claseAjuste = 'size-[52px] rounded-full bg-white text-[26px] font-extrabold text-peso-texto'

  return (
    <PantallaFlujo titulo="Registrar peso" volver={rutas.registroRapido} variante="destacado" ancha>
      <div className="grid gap-4 md:grid-cols-2 md:items-start md:gap-6">
      <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-peso-fondo px-4 py-5">
        <span className="text-[13px] font-bold text-peso-texto">{formatoDiaRelativo(hoy, hoy)}</span>
        <div className="flex items-center gap-[18px]">
          <button type="button" aria-label="Restar 0,1 kg" {...restar} className={claseAjuste}>
            −
          </button>
          <div className="flex min-w-[140px] items-baseline justify-center">
            <input
              type="text"
              inputMode="decimal"
              aria-label="Peso en kilogramos"
              value={escrito ?? formatoPeso(kg)}
              onFocus={(evento) => {
                setEscrito(formatoPeso(kg))
                evento.currentTarget.select()
              }}
              onChange={(evento) => setEscrito(evento.target.value)}
              onBlur={confirmarEscrito}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') {
                  evento.preventDefault()
                  evento.currentTarget.blur()
                }
              }}
              className="w-[5ch] min-w-0 rounded-boton-sm bg-transparent text-center text-[54px] leading-none font-extrabold tracking-[-2px] text-tinta"
            />
            <span aria-hidden="true" className="text-lg font-bold text-peso-texto">
              {' '}
              kg
            </span>
          </div>
          <button type="button" aria-label="Sumar 0,1 kg" {...sumar} className={claseAjuste}>
            +
          </button>
        </div>
        <span aria-live="polite" className="text-[13px] font-bold text-tinta-2">
          {cambio === null
            ? 'Tu primer registro de peso'
            : cambio === 0
              ? 'Igual que tu último registro'
              : `${cambio < 0 ? 'Bajas' : 'Subes'} ${formatoPeso(Math.abs(cambio))} kg vs. último registro`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Dato etiqueta="Meta" valor={`${formatoDecimal(datos.pesoMetaKg)} kg`} />
        <Dato etiqueta="IMC" valor={indice === null ? '—' : formatoPeso(indice)} />
        <Dato etiqueta="Falta" valor={`${formatoPeso(falta)} kg`} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="nota" className="text-[13px] font-semibold">
          Nota (opcional)
        </label>
        <input
          id="nota"
          type="text"
          maxLength={LIMITES_REGISTRO.nota}
          placeholder="En ayunas, después de entrenar..."
          value={nota}
          onChange={(evento) => {
            setNota(evento.target.value)
            setFase('editando')
          }}
          className="h-12 rounded-boton border border-borde bg-crema-suave px-3.5 text-sm font-medium text-tinta"
        />
      </div>

      <div role="status" aria-live="polite" className="mt-auto flex flex-col gap-2.5">
        {fase === 'guardado' ? (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-crema px-3.5 py-3">
              <MascotAvatar tamano={40} />
              <div className="grow text-sm leading-[1.35] font-bold text-kalo-oscuro">
                ¡Peso guardado! Tu gráfica ya está al día.
              </div>
            </div>
            <Button to={rutas.progreso} tamano="xl">
              Ver mi progreso
            </Button>
          </>
        ) : (
          <>
            {fase === 'fallo' && (
              <p className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error">
                No pudimos guardar tu peso. Inténtalo de nuevo.
              </p>
            )}
            <Button tamano="xl" disabled={fase === 'guardando'} onClick={() => void guardar()}>
              {fase === 'guardando' ? 'Guardando…' : 'Guardar peso'}
            </Button>
          </>
        )}
      </div>
      </div>
      <section aria-labelledby="peso-semanas" className="rounded-[20px] border border-borde p-3.5">
        <h2 id="peso-semanas" className="mb-2 text-sm font-extrabold">
          Últimas {SEMANAS} semanas
        </h2>
        {carga.fase === 'error' ? (
          <p role="alert" className="py-6 text-center text-xs font-semibold text-error">
            No pudimos cargar tu historial.
          </p>
        ) : (
          <>
            <LineaPeso valores={serie} meta={datos.pesoMetaKg} />
            <div className="flex justify-between gap-2 text-xs font-semibold text-tinta-3">
              <span>{formatoPeso(serie[0])} kg</span>
              <span className="flex items-center gap-1.5 text-peso-texto">
                <span aria-hidden="true" className="w-4 border-t-2 border-dashed border-sol" />
                Meta {formatoDecimal(datos.pesoMetaKg)} kg
              </span>
              <span>{formatoPeso(kg)} kg</span>
            </div>
          </>
        )}
      </section>
      </div>
    </PantallaFlujo>
  )
}
