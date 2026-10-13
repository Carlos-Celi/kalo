import { useCallback, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { rutas } from '../../app/rutas'
import { usePerfil } from '../perfil/contexto'
import {
  borradorInicial,
  pasoHabitosCompleto,
  pasoObjetivosCompleto,
  pasoPerfilCompleto,
  type Borrador,
  type ContextoOnboarding,
} from './borrador'

/** Primer paso sin completar entre los anteriores a `ruta`; null si se puede entrar. */
function pasoPendiente(ruta: string, borrador: Borrador): string | null {
  const previos: [ruta: string, completo: boolean][] = [
    [rutas.bienvenida, pasoPerfilCompleto(borrador)],
    [rutas.bienvenidaMedidas, true],
    [rutas.bienvenidaObjetivos, pasoObjetivosCompleto(borrador)],
    [rutas.bienvenidaHabitos, pasoHabitosCompleto(borrador)],
  ]
  for (const [previa, completo] of previos) {
    if (previa === ruta) return null
    if (!completo) return previa
  }
  return null
}

/**
 * Guarda las respuestas mientras se recorren los pasos. Viven solo en
 * memoria: se envían al servidor una vez, al guardar el plan.
 */
export function OnboardingLayout() {
  const { perfil } = usePerfil()
  const ubicacion = useLocation()
  const [borrador, setBorrador] = useState(() => borradorInicial(perfil))
  // Se fija al entrar: al guardar el plan el perfil cambia, pero el flujo es el mismo.
  const [rehaciendo] = useState(() => perfil.plan !== null)

  const cambiar = useCallback((cambios: Partial<Borrador>) => {
    setBorrador((actual) => ({ ...actual, ...cambios }))
  }, [])

  const contexto = useMemo<ContextoOnboarding>(
    () => ({ borrador, cambiar, rehaciendo }),
    [borrador, cambiar, rehaciendo],
  )

  const pendiente = pasoPendiente(ubicacion.pathname.replace(/\/+$/, ''), borrador)
  if (pendiente) return <Navigate to={pendiente} replace />

  return <Outlet context={contexto} />
}
