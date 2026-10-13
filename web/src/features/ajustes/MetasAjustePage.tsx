import { useState } from 'react'
import { useTitulo } from '../../app/useTitulo'
import { CampoNumero } from '../../components/ui/CamposNumericos'
import { Icon } from '../../components/ui/Icon'
import { formatoEntero } from '../../domain/formato'
import { LIMITES, type Metas } from '../../domain/perfil'
import { calcularMetas, NOTA_CALORIAS, notaProteina, PASOS } from '../../domain/plan'
import { usePerfil } from '../perfil/contexto'
import { PaginaAjuste, TituloSeccion } from './PaginaAjuste'
import { useGuardarAjuste } from './useGuardarAjuste'

/** Las cinco metas diarias, editables sin volver a empezar el plan. */
export function MetasAjustePage() {
  useTitulo('Metas diarias')
  const { perfil } = usePerfil()
  const { fase, guardar, editar } = useGuardarAjuste()
  const plan = perfil.plan
  const [metas, setMetas] = useState<Metas>(
    plan?.metas ?? { kcal: 1850, proteinaG: 140, aguaL: 2.5, ejercicioMin: 60, suenoMin: 480 },
  )

  if (!plan) return null
  const { datos } = plan
  const sugeridas = calcularMetas(datos)

  function cambiar<K extends keyof Metas>(clave: K, valor: Metas[K]) {
    setMetas((actuales) => ({ ...actuales, [clave]: valor }))
    editar()
  }

  return (
    <PaginaAjuste
      titulo="Metas diarias"
      descripcion="Calorías y proteína son las principales; el resto te ayuda a cuidar tus hábitos."
      fase={fase}
      mensajeGuardado="Metas actualizadas."
      onEnviar={() => void guardar({ ...plan, metas })}
    >
      <section aria-labelledby="metas-principales" className="flex flex-col gap-3">
        <TituloSeccion>
          <span id="metas-principales">Principales</span>
        </TituloSeccion>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border-[1.5px] border-llama bg-crema p-4">
            <CampoNumero
              id="meta-kcal"
              etiqueta="Calorías"
              unidad="kcal"
              valor={metas.kcal}
              min={LIMITES.kcal.min}
              max={LIMITES.kcal.max}
              paso={PASOS.kcal}
              onCambio={(valor) => cambiar('kcal', valor)}
              ayuda={NOTA_CALORIAS[datos.objetivo]}
            />
          </div>
          <div className="rounded-[20px] border-[1.5px] border-llama bg-crema p-4">
            <CampoNumero
              id="meta-proteina"
              etiqueta="Proteína"
              unidad="g"
              valor={metas.proteinaG}
              min={LIMITES.proteinaG.min}
              max={LIMITES.proteinaG.max}
              paso={PASOS.proteinaG}
              onCambio={(valor) => cambiar('proteinaG', valor)}
              ayuda={notaProteina(metas.proteinaG, datos)}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="otras-metas" className="flex flex-col gap-3">
        <TituloSeccion>
          <span id="otras-metas">Hábitos</span>
        </TituloSeccion>
        <div className="grid gap-5 md:grid-cols-3">
          <CampoNumero
            id="meta-agua"
            etiqueta="Agua"
            unidad="L"
            valor={metas.aguaL}
            min={LIMITES.aguaL.min}
            max={LIMITES.aguaL.max}
            paso={PASOS.aguaL}
            decimales={2}
            onCambio={(valor) => cambiar('aguaL', valor)}
          />
          <CampoNumero
            id="meta-ejercicio"
            etiqueta="Ejercicio"
            unidad="min"
            valor={metas.ejercicioMin}
            min={LIMITES.ejercicioMin.min}
            max={LIMITES.ejercicioMin.max}
            paso={PASOS.ejercicioMin}
            onCambio={(valor) => cambiar('ejercicioMin', valor)}
          />
          <CampoNumero
            id="meta-sueno"
            etiqueta="Sueño"
            unidad="h"
            valor={metas.suenoMin / 60}
            min={LIMITES.suenoMin.min / 60}
            max={LIMITES.suenoMin.max / 60}
            paso={PASOS.suenoMin / 60}
            decimales={1}
            onCambio={(horas) => cambiar('suenoMin', Math.round(horas * 60))}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-boton bg-crema-suave p-3.5 sm:flex-row sm:items-center">
        <Icon nombre="destello" tamano={18} grosor={2} className="shrink-0 text-kalo" />
        <p className="grow text-[13px] leading-normal font-medium text-tinta-2">
          Según tu perfil actual te sugerimos{' '}
          <strong className="font-extrabold">{formatoEntero(sugeridas.kcal)} kcal</strong> y{' '}
          <strong className="font-extrabold">{formatoEntero(sugeridas.proteinaG)} g de proteína</strong>.
        </p>
        <button
          type="button"
          onClick={() => {
            setMetas(sugeridas)
            editar()
          }}
          className="h-11 shrink-0 rounded-full bg-white px-4 text-[13px] font-bold text-kalo-oscuro hover:bg-kalo-claro"
        >
          Usar las sugeridas
        </button>
      </div>
    </PaginaAjuste>
  )
}
