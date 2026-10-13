import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
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
    <div className="flex flex-col gap-2 rounded-[20px] border-[1.5px] border-llama bg-crema px-3.5 pt-3.5 pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-full bg-kalo text-white">
          <Icon nombre={icono} tamano={16} />
        </span>
        <span className="grow text-[15px] font-extrabold">{nombre}</span>
        <span className="rounded-full bg-white px-2 py-[3px] text-xs font-bold text-kalo-oscuro">
          Principal
        </span>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label={`Disminuir ${nombre}`}
          onClick={onMenos}
          className="size-12 rounded-boton border border-barra-suave bg-white text-[22px] font-bold text-kalo"
        >
          −
        </button>
        <div aria-live="polite" className="text-center">
          <span className="text-4xl font-extrabold tracking-[-1px] text-kalo-oscuro">{valor}</span>{' '}
          <span className="text-sm font-semibold text-tinta-3">{unidad}</span>
        </div>
        <button
          type="button"
          aria-label={`Aumentar ${nombre}`}
          onClick={onMas}
          className="size-12 rounded-boton bg-kalo text-[22px] font-bold text-white"
        >
          +
        </button>
      </div>
      <p className="text-center text-xs font-medium text-tinta-2">{nota}</p>
    </div>
  )
}

function OtraMeta({ nombre, valor, onMenos, onMas }: AjusteProps & { valor: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-borde py-2 last:border-b-0">
      <span className="grow text-[13px] font-semibold text-tinta-3">{nombre}</span>
      <span aria-live="polite" className="min-w-[74px] text-right text-[15px] font-extrabold">
        {valor}
      </span>
      <button
        type="button"
        aria-label={`Disminuir ${nombre}`}
        onClick={onMenos}
        className="size-11 rounded-boton-sm border border-borde bg-white text-xl font-bold text-kalo"
      >
        −
      </button>
      <button
        type="button"
        aria-label={`Aumentar ${nombre}`}
        onClick={onMas}
        className="size-11 rounded-boton-sm bg-crema text-xl font-bold text-kalo"
      >
        +
      </button>
    </div>
  )
}

const claseSeccion = 'text-xs font-bold tracking-[0.8px] text-tinta-3 uppercase'

/** Plan generado, con las metas ajustables (design/Metas.dc.html). */
export function PlanPaso() {
  useTitulo('Tu plan')
  const { borrador } = useOnboarding()
  const { guardarPlan } = usePerfil()
  const navegar = useNavigate()

  const base = aDatos(borrador)
  const [metas, setMetas] = useState<Metas | null>(() => (base ? calcularMetas(base) : null))
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
      void navegar(rutas.inicio, { replace: true })
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
            <p
              role="alert"
              className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error"
            >
              No pudimos guardar tu plan. Inténtalo de nuevo.
            </p>
          )}
          <Button type="submit" tamano="xl" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar y empezar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5 rounded-[20px] bg-kalo px-[18px] py-4 text-white">
        <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-white px-2.5 py-[5px] text-xs font-bold text-kalo-oscuro">
          <Icon nombre="destello" tamano={12} grosor={2.2} />
          Sugerido para ti
        </div>
        <div className="text-[21px] font-extrabold tracking-[-0.4px]">{resumen.titulo}</div>
        <div className="text-[13px] font-medium text-kalo-claro">{resumen.detalle}</div>
      </div>

      <section aria-labelledby="metas-principales" className="flex flex-col gap-2.5">
        <h2 id="metas-principales" className={claseSeccion}>
          Metas principales · ajústalas
        </h2>
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
      </section>

      <section aria-labelledby="otras-metas" className="flex flex-col gap-2.5">
        <h2 id="otras-metas" className={claseSeccion}>
          Otras metas
        </h2>
        <div className="rounded-tarjeta border border-borde px-3">
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
