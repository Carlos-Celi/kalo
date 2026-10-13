import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { rutas } from '../../app/rutas'
import { useAuth } from './contexto'

export interface EstadoDeLogin {
  /** Ruta interna a la que volver tras iniciar sesión. */
  desde?: string
}

/**
 * Solo deja pasar con sesión iniciada (o en modo demostración, donde no hay
 * datos reales). Es una comodidad de navegación: quien protege los datos es
 * RLS en la base de datos, no esta comprobación.
 */
export function RutaProtegida({ children }: { children: ReactNode }) {
  const estado = useAuth()
  const ubicacion = useLocation()

  if (estado.fase === 'cargando') {
    return (
      <p role="status" className="py-16 text-center text-sm font-medium text-tinta-3">
        Cargando…
      </p>
    )
  }

  if (estado.fase === 'anonimo') {
    const desde: EstadoDeLogin = { desde: ubicacion.pathname }
    return <Navigate to={rutas.login} replace state={desde} />
  }

  return children
}
