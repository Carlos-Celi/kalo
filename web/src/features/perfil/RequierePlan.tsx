import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { usePerfil } from './contexto'

/** Quien aún no tiene plan pasa primero por el onboarding. */
export function RequierePlan({ children }: { children: ReactNode }) {
  const { perfil } = usePerfil()
  return perfil.plan ? children : <Navigate to={rutas.bienvenida} replace />
}
