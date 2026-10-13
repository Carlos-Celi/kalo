import { createContext, useContext } from 'react'
import type { Perfil, Plan } from '../../domain/perfil'

export interface PerfilContexto {
  perfil: Perfil
  /** Guarda el plan y actualiza el perfil en memoria. Rechaza si falla. */
  guardarPlan: (plan: Plan) => Promise<void>
}

export const PerfilContext = createContext<PerfilContexto | null>(null)

export function usePerfil(): PerfilContexto {
  const contexto = useContext(PerfilContext)
  if (!contexto) throw new Error('usePerfil debe usarse dentro de <PerfilProvider>.')
  return contexto
}
