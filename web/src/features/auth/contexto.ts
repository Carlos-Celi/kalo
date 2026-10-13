import { createContext, useContext } from 'react'

export interface Usuario {
  id: string
  correo: string
}

export type EstadoAuth =
  | { fase: 'cargando' }
  /** Sin servidor de cuentas configurado: solo datos de ejemplo. */
  | { fase: 'demo' }
  | { fase: 'anonimo' }
  | { fase: 'autenticado'; usuario: Usuario }

export const AuthContext = createContext<EstadoAuth | null>(null)

export function useAuth(): EstadoAuth {
  const estado = useContext(AuthContext)
  if (!estado) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return estado
}
