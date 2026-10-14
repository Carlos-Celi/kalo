import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Alerta } from '../../components/ui/Alerta'
import { Button } from '../../components/ui/Button'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { formatoDecimal, formatoEntero } from '../../domain/formato'
import { LIMITES, type Metas, type Rango } from '../../domain/perfil'
import {
  ajustar,
  calcularMetas,
  NOTA_CALORIAS,
  notaProteina,
  PASOS,
  resumenDelPlan,
} from '../../domain/plan'
import { useConfigIA } from '../ia/config'
import { usePerfil } from '../perfil/contexto'
import { aDatos, useOnboarding } from './borrador'
import { MarcoOnboarding } from './MarcoOnboarding'

interface AjusteProps {
  nombre: string
  onMenos: () => void
  onMas: () => void
}

interface PrincipalProps extends AjusteProps {
  icono: NombreIcono
  valor: string
  unidad: string
  nota: string
}

function MetaPrincipal({ nombre, icono, valor, unidad, nota, onMenos, onMas }: PrincipalProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[20px] border-[1.5px] border-llama bg-banco px-3.5 pt-3.5 pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-brasa text-white">
          <Icon nombre={icono} tamano={16} />
        </span>
        <span className="grow text-[15px] font-extrabold">{nombre}</span>
        <span className="rounded-full bg-muro px-2 py-[3px] text-xs font-bold text-llama">
          Principal
        </span>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={`Disminuir ${nombre}`}
          onClick={onMenos}
          className="size-12 rounded-boton-sm border border-filo bg-banco text-[22px] font-bold text-hueso hover:bg-filo"
        >
          −
        </button>
        <div aria-live="polite" className="text-center">
          <span className="num-marcador text-[48px] leading-none font-extrabold text-hueso">{valor}</span>{' '}
          <span className="text-sm font-semibold text-ceniza">{unidad}</span>
        </div>
        <button
          type="button"
          aria-label={`Aumentar ${nombre}`}
          onClick={onMas}
          className="size-12 rounded-boton-sm border border-filo bg-banco text-[22px] font-bold text-hueso hover:bg-filo"
        >
          +
        </button>
      </div>
      <p className="text-center text-xs font-medium text-ceniza">{nota}</p>
    </div>
  )
}

function OtraMeta({ nombre, valor, onMenos, onMas }: AjusteProps & { valor: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-filo py-2 last:border-b-0">
      <span className="grow text-[13px] font-semibold text-ceniza">{nombre}</span>
      <span aria-live="polite" className="min-w-[74px] text-right text-[15px] font-extrabold">
        {valor}
      </span>
      <button
        type="button"
        aria-label={`Disminuir ${nombre}`}
        onClick={onMenos}
        className="size-11 rounded-boton-sm border border-filo bg-muro text-xl font-bold text-llama"
      >
        −
      </button>
      <button
        type="button"
        aria-label={`Aumentar ${nombre}`}
        onClick={onMas}
        className="size-11 rounded-boton-sm bg-banco text-xl font-bold text-llama"
      >
        +
      </button>
    </div>
  )
}

const claseSeccion = 'text-xs font-bold tracking-[0.8px] text-ceniza uppercase'

/** Plan generado, con las metas ajustables (design/Metas.dc.html). */
export function PlanPaso() {
  useTitulo('Tu plan')
  const { borrador, rehaciendo } = useOnboarding()
  const navegar = useNavigate()
  const { config } = useConfigIA()
  // La primera vez, tras el plan se ofrece conectar la IA; se puede dejar para después.
  const conectarIA = !rehaciendo && config === null

  const base = aDatos(borrador)
  const { perfil, guardarPlan } = usePerfil()
  const [metas, setMetas] = useState<Metas | null>(() => {
    if (!base) return null
    // Si se llega desde Configuración sin cambiar las respuestas, se parte de las metas ya ajustadas.
    const guardado = perfil.plan
    const sinCambios = guardado && JSON.stringify(guardado.datos) === JSON.stringify(base)
    return sinCambios ? guardado.metas : calcularMetas(base)
  })
  const [pesoMetaKg, setPesoMetaKg] = useState(base?.pesoMetaKg ?? 0)
  const [guardando, setGuardando] = useState(false)
  const [fallo, setFallo] = useState(false)

  if (!base || !metas) return <Navigate to={rutas.bienvenida} replace />

  const datos = { ...base, pesoMetaKg }
  const resumen = resumenDelPlan(datos)

  function mover(clave: keyof Metas, sentido: 1 | -1, rango: Rango) {
    setMetas((actuales) =>
      actuales
        ? { ...actuales, [clave]: ajustar(actuales[clave], sentido * PASOS[clave], rango) }
        : actuales,
    )
  }

  async function guardar() {
    if (guardando || !metas) return
    setGuardando(true)
    setFallo(false)
    try {
      await guardarPlan({ datos, metas })
      void navegar(conectarIA ? rutas.bienvenidaIA : rutas.inicio, { replace: true })
    } catch {
      setFallo(true)
      setGuardando(false)
    }
  }

  return (
    <MarcoOnboarding
      encabezado="Tu plan"
      volver={rutas.bienvenidaHabitos}
      onEnviar={() => void guardar()}
      pie={
        <>
          {fallo && (
            <Alerta titulo="No pudimos guardar tu plan">
              Tus respuestas y tus ajustes siguen aquí. Revisa tu conexión y pulsa de nuevo.
            </Alerta>
          )}
          <Button type="submit" tamano="xl" disabled={guardando}>
            {guardando ? 'Guardando…' : conectarIA ? 'Guardar y continuar' : 'Guardar y empezar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5 rounded-tarjeta bg-muro px-[18px] py-4 text-hueso">
        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-llama/15 px-2.5 py-[5px] text-xs font-bold text-llama">
          <Icon nombre="destello" tamano={12} grosor={2.2} />
          Sugerido para ti
        </div>
        <div className="num-marcador text-[34px] leading-none font-extrabold uppercase">{resumen.titulo}</div>
        <div className="text-[13px] font-semibold text-ceniza">{resumen.detalle}</div>
      </div>

      <section aria-labelledby="metas-principales" className="flex flex-col gap-2.5">
        <h2 id="metas-principales" className={claseSeccion}>
          Metas principales · ajústalas
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
        <MetaPrincipal
          nombre="Calorías"
          icono="llama"
          valor={formatoEntero(metas.kcal)}
          unidad="kcal"
          nota={NOTA_CALORIAS[datos.objetivo]}
          onMenos={() => mover('kcal', -1, LIMITES.kcal)}
          onMas={() => mover('kcal', 1, LIMITES.kcal)}
        />
        <MetaPrincipal
          nombre="Proteína"
          icono="muslo"
          valor={formatoEntero(metas.proteinaG)}
          unidad="g"
          nota={notaProteina(metas.proteinaG, datos)}
          onMenos={() => mover('proteinaG', -1, LIMITES.proteinaG)}
          onMas={() => mover('proteinaG', 1, LIMITES.proteinaG)}
        />
        </div>
      </section>

      <section aria-labelledby="otras-metas" className="flex flex-col gap-2.5">
        <h2 id="otras-metas" className={claseSeccion}>
          Otras metas
        </h2>
        <div className="grid rounded-tarjeta border border-filo px-3 sm:grid-cols-2 sm:gap-x-8">
          <OtraMeta
            nombre="Agua"
            valor={`${formatoDecimal(metas.aguaL, 2)} L`}
            onMenos={() => mover('aguaL', -1, LIMITES.aguaL)}
            onMas={() => mover('aguaL', 1, LIMITES.aguaL)}
          />
          <OtraMeta
            nombre="Ejercicio"
            valor={`${metas.ejercicioMin} min`}
            onMenos={() => mover('ejercicioMin', -1, LIMITES.ejercicioMin)}
            onMas={() => mover('ejercicioMin', 1, LIMITES.ejercicioMin)}
          />
          <OtraMeta
            nombre="Sueño"
            valor={`${formatoDecimal(metas.suenoMin / 60)} h`}
            onMenos={() => mover('suenoMin', -1, LIMITES.suenoMin)}
            onMas={() => mover('suenoMin', 1, LIMITES.suenoMin)}
          />
          <OtraMeta
            nombre="Peso meta"
            valor={`${formatoDecimal(pesoMetaKg)} kg`}
            onMenos={() => setPesoMetaKg((kg) => ajustar(kg, -PASOS.pesoKg, LIMITES.pesoKg))}
            onMas={() => setPesoMetaKg((kg) => ajustar(kg, PASOS.pesoKg, LIMITES.pesoKg))}
          />
        </div>
      </section>
    </MarcoOnboarding>
  )
}
