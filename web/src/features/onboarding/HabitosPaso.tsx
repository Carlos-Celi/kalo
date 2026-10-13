import { useState } from 'react'
import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { GrupoChips as Grupo } from '../../components/ui/GrupoChips'
import { Icon } from '../../components/ui/Icon'
import type { Restriccion } from '../../domain/perfil'
import {
  opcionesActividad,
  opcionesAlcohol,
  opcionesRestriccion,
  opcionesSueno,
} from '../perfil/opciones'
import { pasoHabitosCompleto, useOnboarding } from './borrador'
import { MarcoOnboarding } from './MarcoOnboarding'

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
      <div className="grid gap-6 sm:grid-cols-2">
      <Grupo
        pregunta="¿Qué tan activo eres?"
        opciones={opcionesActividad}
        elegidas={borrador.actividad ? [borrador.actividad] : []}
        onElegir={(actividad) => cambiar({ actividad })}
        falta={revisado && !borrador.actividad}
      />
      <Grupo
        pregunta="¿Cuántas horas duermes?"
        opciones={opcionesSueno}
        elegidas={borrador.suenoHabitual ? [borrador.suenoHabitual] : []}
        onElegir={(suenoHabitual) => cambiar({ suenoHabitual })}
        falta={revisado && !borrador.suenoHabitual}
      />
      <Grupo
        pregunta="¿Con qué frecuencia tomas alcohol?"
        opciones={opcionesAlcohol}
        elegidas={borrador.alcohol ? [borrador.alcohol] : []}
        onElegir={(alcohol) => cambiar({ alcohol })}
        falta={revisado && !borrador.alcohol}
      />
      <Grupo
        pregunta="Restricciones o condiciones"
        opciones={opcionesRestriccion}
        elegidas={borrador.restricciones}
        onElegir={alternar}
      />
      </div>
    </MarcoOnboarding>
  )
}
