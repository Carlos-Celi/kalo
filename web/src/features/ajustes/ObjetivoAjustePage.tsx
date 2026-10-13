import { useState } from 'react'
import { useTitulo } from '../../app/useTitulo'
import { GrupoChips } from '../../components/ui/GrupoChips'
import type { Actividad, Alcohol, Objetivo, Restriccion, SuenoHabitual } from '../../domain/perfil'
import { pesoMetaSugerido } from '../../domain/plan'
import { ElegirObjetivo } from '../perfil/ElegirObjetivo'
import { usePerfil } from '../perfil/contexto'
import {
  opcionesActividad,
  opcionesAlcohol,
  opcionesRestriccion,
  opcionesSueno,
} from '../perfil/opciones'
import { PaginaAjuste, TituloSeccion } from './PaginaAjuste'
import { useGuardarAjuste } from './useGuardarAjuste'

/** Objetivo principal y hábitos, sin pasar por el onboarding. */
export function ObjetivoAjustePage() {
  useTitulo('Objetivo y hábitos')
  const { perfil } = usePerfil()
  const { fase, guardar, editar } = useGuardarAjuste()
  const plan = perfil.plan
  const [objetivo, setObjetivo] = useState<Objetivo | null>(plan?.datos.objetivo ?? null)
  const [actividad, setActividad] = useState<Actividad | null>(plan?.datos.actividad ?? null)
  const [suenoHabitual, setSuenoHabitual] = useState<SuenoHabitual | null>(plan?.datos.suenoHabitual ?? null)
  const [alcohol, setAlcohol] = useState<Alcohol | null>(plan?.datos.alcohol ?? null)
  const [restricciones, setRestricciones] = useState<Restriccion[]>(plan?.datos.restricciones ?? [])

  if (!plan) return null

  function enviar() {
    if (!plan || !objetivo || !actividad || !suenoHabitual || !alcohol) return
    // Al cambiar de objetivo se propone un peso meta acorde; se puede corregir en «Medidas y peso».
    const pesoMetaKg =
      objetivo === plan.datos.objetivo
        ? plan.datos.pesoMetaKg
        : pesoMetaSugerido(objetivo, plan.datos.pesoKg)
    void guardar({
      ...plan,
      datos: { ...plan.datos, objetivo, actividad, suenoHabitual, alcohol, restricciones, pesoMetaKg },
    })
  }

  const completo = objetivo !== null && actividad !== null && suenoHabitual !== null && alcohol !== null

  return (
    <PaginaAjuste
      titulo="Objetivo y hábitos"
      descripcion="Con esto el asistente y tu plan saben cómo ayudarte."
      fase={fase}
      mensajeGuardado="Objetivo y hábitos actualizados."
      onEnviar={enviar}
      deshabilitado={!completo}
    >
      <section aria-labelledby="titulo-objetivo" className="flex flex-col gap-3">
        <div id="titulo-objetivo">
          <TituloSeccion>Objetivo principal</TituloSeccion>
        </div>
        <ElegirObjetivo
          valor={objetivo}
          onElegir={(valor) => {
            setObjetivo(valor)
            editar()
          }}
        />
      </section>

      <section aria-labelledby="titulo-habitos" className="grid gap-6 md:grid-cols-2">
        <h2 id="titulo-habitos" className="sr-only">
          Hábitos
        </h2>
        <GrupoChips
          pregunta="¿Qué tan activo eres?"
          opciones={opcionesActividad}
          elegidas={actividad ? [actividad] : []}
          onElegir={(valor) => {
            setActividad(valor)
            editar()
          }}
        />
        <GrupoChips
          pregunta="¿Cuántas horas duermes?"
          opciones={opcionesSueno}
          elegidas={suenoHabitual ? [suenoHabitual] : []}
          onElegir={(valor) => {
            setSuenoHabitual(valor)
            editar()
          }}
        />
        <GrupoChips
          pregunta="¿Con qué frecuencia tomas alcohol?"
          opciones={opcionesAlcohol}
          elegidas={alcohol ? [alcohol] : []}
          onElegir={(valor) => {
            setAlcohol(valor)
            editar()
          }}
        />
        <GrupoChips
          pregunta="Restricciones o condiciones"
          opciones={opcionesRestriccion}
          elegidas={restricciones}
          onElegir={(valor) => {
            setRestricciones((actuales) =>
              actuales.includes(valor) ? actuales.filter((otra) => otra !== valor) : [...actuales, valor],
            )
            editar()
          }}
        />
      </section>
    </PaginaAjuste>
  )
}
