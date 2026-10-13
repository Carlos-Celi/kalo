import { useEffect, useState } from 'react'
import { repositorios } from '../../data'
import type { ResumenInicio } from '../../domain/tipos'

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; resumen: ResumenInicio }
  | { fase: 'error' }

export function useResumenInicio(): Estado {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })

  useEffect(() => {
    let vigente = true
    repositorios.resumen
      .obtenerResumenInicio()
      .then((resumen) => {
        if (vigente) setEstado({ fase: 'listo', resumen })
      })
      .catch(() => {
        if (vigente) setEstado({ fase: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [])

  return estado
}
