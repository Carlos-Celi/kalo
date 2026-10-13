import { useCallback, useState } from 'react'
import type { Plan } from '../../domain/perfil'
import { usePerfil } from '../perfil/contexto'

export type Fase = 'editando' | 'guardando' | 'guardado' | 'fallo'

/** Guarda el plan desde una pantalla de Configuración y lleva la cuenta de cómo va. */
export function useGuardarAjuste() {
  const { guardarPlan } = usePerfil()
  const [fase, setFase] = useState<Fase>('editando')

  const guardar = useCallback(
    async (plan: Plan, tambien?: () => Promise<void>) => {
      setFase('guardando')
      try {
        await guardarPlan(plan)
        await tambien?.()
        setFase('guardado')
      } catch {
        setFase('fallo')
      }
    },
    [guardarPlan],
  )

  return { fase, guardar, editar: () => setFase((actual) => (actual === 'editando' ? actual : 'editando')) }
}
