import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { repositorios } from '../../data'
import type { Perfil, Plan } from '../../domain/perfil'
import { PerfilContext, type PerfilContexto } from './contexto'

type Estado = { fase: 'cargando' } | { fase: 'error' } | { fase: 'listo'; perfil: Perfil }

/**
 * Carga el perfil del usuario con sesión y lo comparte con las pantallas.
 * Sus hijos solo se pintan cuando el perfil ya está disponible.
 */
export function PerfilProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    repositorios.perfil
      .obtener()
      .then((perfil) => {
        if (vigente) setEstado({ fase: 'listo', perfil })
      })
      .catch(() => {
        if (vigente) setEstado({ fase: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [intento])

  const guardarPlan = useCallback(async (plan: Plan) => {
    await repositorios.perfil.guardarPlan(plan)
    setEstado({ fase: 'listo', perfil: { nombre: plan.datos.nombre, plan } })
  }, [])

  const perfil = estado.fase === 'listo' ? estado.perfil : null
  const contexto = useMemo<PerfilContexto | null>(
    () => (perfil ? { perfil, guardarPlan } : null),
    [perfil, guardarPlan],
  )

  if (estado.fase === 'cargando') {
    return (
      <p role="status" className="py-16 text-center text-sm font-medium text-tinta-3">
        Cargando…
      </p>
    )
  }

  if (!contexto) {
    return (
      <div className="flex flex-col items-center gap-4 px-5 py-16 text-center">
        <p role="alert" className="text-sm font-semibold text-error">
          No pudimos cargar tu perfil.
        </p>
        <Button
          variante="suave"
          onClick={() => {
            setEstado({ fase: 'cargando' })
            setIntento((actual) => actual + 1)
          }}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return <PerfilContext value={contexto}>{children}</PerfilContext>
}
