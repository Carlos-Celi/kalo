import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { CampoNumero } from '../../components/ui/CamposNumericos'
import { Icon } from '../../components/ui/Icon'
import { Interruptor } from '../../components/ui/Interruptor'
import { PantallaFlujo } from '../../components/ui/PantallaFlujo'
import { useContador } from '../../components/ui/useAnimacion'
import { repositorios } from '../../data'
import { formatoDecimal, formatoEntero, numeroDeTexto } from '../../domain/formato'
import {
  ErrorIA,
  escalarAnalisis,
  MAXIMO_UNIDADES,
  mensajeDeFalloIA,
  nivelDe,
  referencias,
  type AnalisisComida,
  type Nivel,
} from '../../domain/ia'
import { usePerfil } from '../perfil/contexto'
import { CamposComida } from '../registros/ComidaFormPage'
import {
  borradorDeComida,
  tiposDeComida,
  validarComida,
  type BorradorComida,
  type ErroresComida,
} from '../registros/comidaBorrador'
import { useConfigIA } from './config'
import { comprimirMiniatura, dejarFoto, fotoPendiente, kilobytesDe } from './foto'

type Estado =
  | { fase: 'analizando' }
  | { fase: 'fallo'; mensaje: string }
  | { fase: 'listo'; analisis: AnalisisComida }

const numero = (valor: number) => String(valor).replace('.', ',')

const PASOS_DE_ANALISIS = [
  'Reconociendo los alimentos…',
  'Contando las unidades…',
  'Estimando las calorías…',
  'Calculando proteína, azúcar y grasa…',
]

/** Mensajes que van cambiando mientras la IA trabaja, con tres puntos que saltan. */
function PasosDeAnalisis() {
  const [paso, setPaso] = useState(0)
  useEffect(() => {
    const reloj = setInterval(() => setPaso((actual) => (actual + 1) % PASOS_DE_ANALISIS.length), 1600)
    return () => clearInterval(reloj)
  }, [])
  return (
    <div className="flex flex-col items-center gap-3 py-5">
      <p role="status" className="sr-only">
        La IA está estimando calorías, proteína, azúcar y grasa…
      </p>
      <p aria-hidden="true" key={paso} className="animate-aparecer text-sm font-bold text-kalo-oscuro">
        {PASOS_DE_ANALISIS[paso]}
      </p>
      <div aria-hidden="true" className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-punto rounded-full bg-llama"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  )
}

/** Las calorías suben hasta su valor al aparecer el resultado y al corregir la cantidad. */
function CifraKcal({ valor }: { valor: number }) {
  return <>{formatoEntero(useContador(valor))}</>
}

const claseNivel: Record<Nivel, string> = {
  Bajo: 'bg-crema text-kalo-oscuro',
  Medio: 'bg-media-fondo text-peso-texto',
  Alto: 'bg-error-fondo text-error',
}

function Macro({ nombre, gramos, referencia, relleno, pista }: { nombre: string; gramos: number; referencia: number; relleno: string; pista: string }) {
  const nivel = nivelDe(gramos, referencia)
  const porcentaje = Math.round((gramos / referencia) * 100)
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-borde p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-tinta-3">{nombre}</span>
        <span className={`rounded-md px-[7px] py-px text-xs font-bold ${claseNivel[nivel]}`}>
          {nivel}
        </span>
      </div>
      <div className="text-lg font-extrabold">{formatoDecimal(gramos)} g</div>
      <div aria-hidden="true" className={`h-1.5 rounded-full ${pista}`}>
        <div className={`h-1.5 rounded-full ${relleno}`} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
      </div>
      <div className="text-xs font-medium text-tinta-3">{porcentaje} % de la referencia diaria</div>
    </div>
  )
}

/** Resultado del análisis de la foto, editable antes de guardar (design/Analisis.dc.html). */
export function AnalisisPage() {
  useTitulo('Resultado de la IA')
  const navegar = useNavigate()
  const { perfil } = usePerfil()
  const { config, cliente: obtenerCliente } = useConfigIA()
  const [tomada] = useState(fotoPendiente)
  const [intento, setIntento] = useState(0)
  const [estado, setEstado] = useState<Estado>({ fase: 'analizando' })
  const [borrador, setBorrador] = useState<BorradorComida | null>(null)
  const [editando, setEditando] = useState(false)
  const [errores, setErrores] = useState<ErroresComida>({})
  const [guardado, setGuardado] = useState<'no' | 'guardando' | 'fallo'>('no')
  // Cuántas unidades se cuentan: parte de lo que detectó la IA y se puede corregir.
  const [cantidad, setCantidad] = useState<number | null>(null)
  const [conFoto, setConFoto] = useState(true)
  const miniatura = useMemo(() => (tomada ? comprimirMiniatura(tomada.lienzo) : null), [tomada])

  // La foto se pinta en un lienzo: no hace falta abrir la CSP a imágenes `data:`.
  // Es una referencia con función porque el lienzo se vuelve a montar cuando
  // cambia la composición de la pantalla (analizando → resultado).
  const pintarFoto = useCallback(
    (destino: HTMLCanvasElement | null) => {
      if (!destino || !tomada) return
      destino.width = tomada.lienzo.width
      destino.height = tomada.lienzo.height
      destino.getContext('2d')?.drawImage(tomada.lienzo, 0, 0)
    },
    [tomada],
  )

  useEffect(() => {
    if (!tomada || !config) return
    let vigente = true
    obtenerCliente()
      .then((cliente) =>
        cliente.analizarFoto(
          config.modelo,
          tomada.foto,
          `Tipo de comida: ${tiposDeComida[tomada.tipo].etiqueta}. Analiza la foto.`,
        ),
      )
      .then((analisis) => {
        if (!vigente) return
        setEstado({ fase: 'listo', analisis })
        setCantidad(analisis.cantidad)
        setBorrador(
          borradorDeComida({
            tipo: analisis.es_alcohol ? 'licor' : tomada.tipo,
            nombre: analisis.nombre,
            porcion: analisis.porcion,
            kcal: analisis.kcal,
            proteinaG: analisis.proteina_g,
            carbohidratosG: analisis.carbohidratos_g,
            azucarG: analisis.azucar_g,
            grasaG: analisis.grasa_g,
            esAlcohol: analisis.es_alcohol,
            gradosAlcohol: analisis.grados_alcohol,
          }),
        )
      })
      .catch((error: unknown) => {
        if (!vigente) return
        setEstado({
          fase: 'fallo',
          mensaje: mensajeDeFalloIA[error instanceof ErrorIA ? error.motivo : 'desconocido'],
        })
      })
    return () => {
      vigente = false
    }
  }, [tomada, config, obtenerCliente, intento])

  const metas = perfil.plan?.metas
  if (!tomada || !config || !metas) return <Navigate to={rutas.camara} replace />

  const volver = `${rutas.camara}?tipo=${tomada.tipo}&fecha=${tomada.fecha}`
  const manual = `${rutas.comidaManual}?tipo=${tomada.tipo}&fecha=${tomada.fecha}`

  async function guardar() {
    if (!borrador || !tomada || guardado === 'guardando') return
    const resultado = validarComida(borrador, tomada.fecha, 'ia')
    if ('errores' in resultado) {
      setErrores(resultado.errores)
      setEditando(true)
      return
    }
    setErrores({})
    setGuardado('guardando')
    try {
      await repositorios.registros.agregarComida(resultado.comida, conFoto ? miniatura : null)
      dejarFoto(null)
      void navegar(`${rutas.registros}?fecha=${tomada.fecha}`)
    } catch {
      setGuardado('fallo')
    }
  }

  const foto = (
    <div className="relative overflow-hidden rounded-3xl bg-camara-visor">
      <canvas
        ref={pintarFoto}
        role="img"
        aria-label="Foto del plato analizado"
        className="block h-auto max-h-[220px] w-full object-cover"
      />
      {estado.fase === 'analizando' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-camara/35" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:28px_28px] opacity-50" />
          <div className="absolute inset-x-0 h-24 -translate-y-1/2 animate-escaneo bg-linear-to-b from-transparent via-sol/35 to-transparent" />
          <div className="absolute inset-x-0 h-[3px] -translate-y-1/2 animate-escaneo bg-sol shadow-[0_0_16px_4px_rgba(255,201,51,0.7)]" />
          {(
            [
              'top-3 left-3 border-t-[3px] border-l-[3px] rounded-tl-xl',
              'top-3 right-3 border-t-[3px] border-r-[3px] rounded-tr-xl',
              'bottom-3 left-3 border-b-[3px] border-l-[3px] rounded-bl-xl',
              'bottom-3 right-3 border-b-[3px] border-r-[3px] rounded-br-xl',
            ] as const
          ).map((esquina) => (
            <div key={esquina} className={`absolute size-8 animate-latido border-sol ${esquina}`} />
          ))}
        </div>
      )}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-kalo-oscuro">
        <Icon nombre="destello" tamano={12} grosor={2.2} className={estado.fase === 'listo' ? '' : 'animate-brillo'} />
        {estado.fase === 'listo' ? 'Analizado con IA' : 'Analizando con IA'}
      </div>
    </div>
  )

  if (estado.fase !== 'listo' || !borrador) {
    return (
      <PantallaFlujo titulo="Resultado de la IA" volver={volver}>
        {foto}
        {estado.fase === 'fallo' ? (
          <div className="flex flex-col gap-3">
            <p role="alert" className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error">
              {estado.mensaje}
            </p>
            <Button
              tamano="lg"
              onClick={() => {
                setEstado({ fase: 'analizando' })
                setIntento((actual) => actual + 1)
              }}
            >
              Reintentar
            </Button>
            <Button variante="suave" tamano="lg" to={manual}>
              Ingresar a mano
            </Button>
          </div>
        ) : (
          <PasosDeAnalisis />
        )}
      </PantallaFlujo>
    )
  }

  const base = estado.analisis
  const analisis = escalarAnalisis(base, cantidad ?? base.cantidad)

  function cambiarCantidad(nueva: number) {
    const escalado = escalarAnalisis(base, nueva)
    setCantidad(escalado.cantidad)
    setBorrador((actual) =>
      actual
        ? {
            ...actual,
            kcal: numero(escalado.kcal),
            proteinaG: numero(escalado.proteina_g),
            carbohidratosG: numero(escalado.carbohidratos_g),
            azucarG: numero(escalado.azucar_g),
            grasaG: numero(escalado.grasa_g),
            porcion:
              escalado.cantidad === base.cantidad
                ? base.porcion
                : `${numero(escalado.cantidad)} × ${escalado.unidad || 'unidades'}`.slice(0, 40),
          }
        : actual,
    )
  }
  // El resumen muestra lo que se va a guardar: la estimación con las correcciones del usuario.
  const corregido = (texto: string, estimado: number) => {
    const valor = numeroDeTexto(texto)
    return Number.isFinite(valor) ? valor : estimado
  }
  const kcal = corregido(borrador.kcal, analisis.kcal)
  const proteinaG = corregido(borrador.proteinaG, analisis.proteina_g)
  const carbohidratosG = corregido(borrador.carbohidratosG, analisis.carbohidratos_g)
  const azucarG = corregido(borrador.azucarG, analisis.azucar_g)
  const grasaG = corregido(borrador.grasaG, analisis.grasa_g)
  const porcentajeProteina = Math.round((proteinaG / metas.proteinaG) * 100)

  return (
    <PantallaFlujo titulo="Resultado de la IA" volver={volver} ancha>
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-start md:gap-6">
      {foto}

      <div className="flex animate-aparecer flex-col gap-4">
      {editando ? (
        <CamposComida
          borrador={borrador}
          errores={errores}
          onCambio={(cambios) => setBorrador((actual) => (actual ? { ...actual, ...cambios } : actual))}
        />
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl leading-tight font-extrabold tracking-[-0.4px]">{borrador.nombre}</h2>
              <span className="shrink-0 rounded-full bg-crema px-2.5 py-1 text-xs font-bold text-kalo-oscuro">
                {tiposDeComida[borrador.tipo].etiqueta}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-tinta-3">
              <Icon nombre="escudo" tamano={14} />
              Confianza de la IA: {analisis.confianza} %
            </div>
          </div>

          <div className="flex items-center justify-between rounded-tarjeta bg-crema px-4 py-3.5">
            <div className="flex items-baseline gap-1.5 text-kalo-oscuro">
              <span className="text-[40px] leading-none font-extrabold tracking-[-1px]">
                <CifraKcal valor={kcal} />
              </span>
              <span className="text-sm font-bold">kcal</span>
            </div>
            {kcal === analisis.kcal && (
              <div className="text-right">
                <div className="text-xs font-medium text-tinta-3">Rango estimado</div>
                <div className="text-[13px] font-extrabold">
                  {formatoEntero(analisis.kcal_minimo)} – {formatoEntero(analisis.kcal_maximo)} kcal
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-borde p-3.5">
            <CampoNumero
              id="cantidad"
              etiqueta="Cantidad"
              unidad={analisis.cantidad === 1 ? 'unidad' : 'unidades'}
              valor={analisis.cantidad}
              min={0.5}
              max={MAXIMO_UNIDADES}
              paso={0.5}
              decimales={1}
              onCambio={cambiarCantidad}
              ayuda={`${analisis.unidad || 'Unidad'} · ≈ ${formatoEntero(Math.round(analisis.kcal / analisis.cantidad))} kcal c/u. Escríbela o ajústala: los totales se recalculan.`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Macro nombre="Azúcar" gramos={azucarG} referencia={referencias.azucarG} relleno="bg-azucar" pista="bg-azucar-pista" />
            <Macro nombre="Grasa" gramos={grasaG} referencia={referencias.grasaG} relleno="bg-ejercicio" pista="bg-grasa-pista" />
          </div>

          <div className="flex flex-col gap-2.5 rounded-2xl border border-borde p-3.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[13px] font-bold">
                <span>Proteína · meta principal</span>
                <span>{formatoDecimal(proteinaG)} g</span>
              </div>
              <div aria-hidden="true" className="h-1.5 rounded-full bg-proteina-pista">
                <div className="h-1.5 rounded-full bg-proteina" style={{ width: `${Math.min(porcentajeProteina, 100)}%` }} />
              </div>
              <div className="text-xs font-medium text-tinta-3">
                {porcentajeProteina} % de tu meta diaria de {formatoEntero(metas.proteinaG)} g
              </div>
            </div>
            <div className="flex justify-between border-t border-divisor pt-2.5 text-[13px] font-semibold">
              <span className="text-tinta-3">Carbohidratos</span>
              <span className="font-extrabold">{formatoDecimal(carbohidratosG)} g</span>
            </div>
          </div>

          {analisis.ingredientes.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold">Ingredientes detectados</h3>
              <ul className="flex flex-wrap gap-1.5">
                {analisis.ingredientes.map((ingrediente) => (
                  <li key={ingrediente} className="rounded-full border border-borde bg-crema-suave px-3 py-1.5 text-xs font-semibold">
                    {ingrediente}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {miniatura && (
        <div className="flex items-center gap-3 rounded-2xl bg-crema-suave px-3.5 py-3 ring-1 ring-borde">
          <div className="grow">
            <div className="text-[13px] font-bold">Guardar la foto con esta comida</div>
            <div className="text-xs font-medium text-tinta-3">
              Ultracomprimida (≈ {kilobytesDe(miniatura)} KB). La verás al abrir la comida.
            </div>
          </div>
          <Interruptor
            etiqueta="Guardar la foto con esta comida"
            activo={conFoto}
            onCambio={() => setConFoto((actual) => !actual)}
          />
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        {guardado === 'fallo' && (
          <p role="alert" className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error">
            No pudimos guardar la comida. Inténtalo de nuevo.
          </p>
        )}
        <Button tamano="lg" disabled={guardado === 'guardando'} onClick={() => void guardar()} className="gap-1.5 text-sm">
          <Icon nombre="check" tamano={18} grosor={2.4} />
          {guardado === 'guardando' ? 'Guardando…' : `Guardar en ${tiposDeComida[borrador.tipo].destino}`}
        </Button>
        <Button variante="suave" tamano="lg" onClick={() => setEditando((actual) => !actual)} className="gap-1.5">
          <Icon nombre="lapiz" tamano={18} />
          {editando ? 'Ver resumen' : 'Editar'}
        </Button>
      </div>
      </div>
      </div>
    </PantallaFlujo>
  )
}
