import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { AuthContext, type EstadoAuth } from './contexto'

/**
 * Mantiene el estado de la sesión. Sin Supabase configurado la app queda en
 * modo demostración: no hay cuentas y solo se muestran datos de ejemplo.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>(
    supabase ? { fase: 'cargando' } : { fase: 'demo' },
  )

  useEffect(() => {
    if (!supabase) return
    // Emite INITIAL_SESSION al suscribirse, así que cubre también el arranque.
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setEstado(
        sesion
          ? {
              fase: 'autenticado',
              usuario: { id: sesion.user.id, correo: sesion.user.email ?? '' },
            }
          : { fase: 'anonimo' },
      )
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return <AuthContext value={estado}>{children}</AuthContext>
}
