import { useState } from 'react'
import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import type { Actividad, Alcohol, Restriccion, SuenoHabitual } from '../../domain/perfil'
import { pasoHabitosCompleto, useOnboarding } from './borrador'
import { MarcoOnboarding } from './MarcoOnboarding'

type Opciones<T> = { valor: T; etiqueta: string }[]

const actividades: Opciones<Actividad> = [
  { valor: 'sedentario', etiqueta: 'Sedentario' },
  { valor: 'ligero', etiqueta: 'Ligero 1–2 días' },
  { valor: 'moderado', etiqueta: 'Moderado 3–4 días' },
  { valor: 'intenso', etiqueta: 'Intenso 5+ días' },
]

const suenos: Opciones<SuenoHabitual> = [
  { valor: 'menos-5', etiqueta: 'Menos de 5 h' },
  { valor: '5-7', etiqueta: '5–7 h' },
  { valor: '7-9', etiqueta: '7–9 h' },
  { valor: 'mas-9', etiqueta: 'Más de 9 h' },
]

const alcoholes: Opciones<Alcohol> = [
  { valor: 'nunca', etiqueta: 'Nunca' },
  { valor: 'fines-de-semana', etiqueta: 'Fines de semana' },
  { valor: 'frecuente', etiqueta: 'Varias veces por semana' },
]

const restricciones: Opciones<Restriccion> = [
  { valor: 'vegetariano', etiqueta: 'Vegetariano' },
  { valor: 'sin-lactosa', etiqueta: 'Sin lactosa' },
  { valor: 'sin-gluten', etiqueta: 'Sin gluten' },
  { valor: 'diabetes', etiqueta: 'Diabetes' },
  { valor: 'hipertension', etiqueta: 'Hipertensión' },
]

interface GrupoProps<T> {
  pregunta: string
  opciones: Opciones<T>
  elegidas: readonly T[]
  onElegir: (valor: T) => void
  falta?: boolean
}

function Grupo<T extends string>({ pregunta, opciones, elegidas, onElegir, falta }: GrupoProps<T>) {
  return (
    <div role="group" aria-label={pregunta} className="flex flex-col gap-2.5">
      <div className="text-sm font-bold">{pregunta}</div>
      <div className="flex flex-wrap gap-2">
        {opciones.map(({ valor, etiqueta }) => (
          <Chip
            key={valor}
            tono="crema"
            seleccionado={elegidas.includes(valor)}
            onClick={() => onElegir(valor)}
          >
            {etiqueta}
          </Chip>
        ))}
      </div>
      {falta && <p className="text-xs font-semibold text-error">Elige una opción.</p>}
    </div>
  )
}

/** Paso 4 del onboarding (design/Habitos.dc.html). */
export function HabitosPaso() {
  useTitulo('Tus hábitos')
  const { borrador, cambiar } = useOnboarding()
  const navegar = useNavigate()
  const [revisado, setRevisado] = useState(false)

  function continuar() {
    setRevisado(true)
    if (pasoHabitosCompleto(borrador)) void navegar(rutas.bienvenidaPlan)
  }

  function alternar(restriccion: Restriccion) {
    const actuales = borrador.restricciones
    cambiar({
      restricciones: actuales.includes(restriccion)
        ? actuales.filter((otra) => otra !== restriccion)
        : [...actuales, restriccion],
    })
  }

  return (
    <MarcoOnboarding
      paso={4}
      volver={rutas.bienvenidaObjetivos}
      titulo="Cuéntanos tus hábitos"
      lema="Con esto armamos tu plan de agua, ejercicio y sueño."
      onEnviar={continuar}
      pie={
        <Button type="submit" tamano="xl" className="gap-2">
          <Icon nombre="destello" tamano={18} grosor={2} />
          Generar mi plan
        </Button>
      }
    >
      <Grupo
        pregunta="¿Qué tan activo eres?"
        opciones={actividades}
        elegidas={borrador.actividad ? [borrador.actividad] : []}
        onElegir={(actividad) => cambiar({ actividad })}
        falta={revisado && !borrador.actividad}
      />
      <Grupo
        pregunta="¿Cuántas horas duermes?"
        opciones={suenos}
        elegidas={borrador.suenoHabitual ? [borrador.suenoHabitual] : []}
        onElegir={(suenoHabitual) => cambiar({ suenoHabitual })}
        falta={revisado && !borrador.suenoHabitual}
      />
      <Grupo
        pregunta="¿Con qué frecuencia tomas alcohol?"
        opciones={alcoholes}
        elegidas={borrador.alcohol ? [borrador.alcohol] : []}
        onElegir={(alcohol) => cambiar({ alcohol })}
        falta={revisado && !borrador.alcohol}
      />
      <Grupo
        pregunta="Restricciones o condiciones"
        opciones={restricciones}
        elegidas={borrador.restricciones}
        onElegir={alternar}
      />
    </MarcoOnboarding>
  )
}
