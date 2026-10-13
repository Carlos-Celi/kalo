import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { repositorios } from '../../data'
import {
  leerRecordatorios,
  recordatoriosPorDefecto,
  type Recordatorio,
} from '../../domain/recordatorios'
import { useAuth } from '../auth/contexto'

// Los recordatorios se guardan en este dispositivo, por usuario, y con una
// cuenta se copian a Supabase para que el servidor pueda avisar por correo.
// Lo local manda: la pantalla no espera a la red.
const PREFIJO = 'kalo:recordatorios:'
const CAMBIO = 'kalo:recordatorios'

const porDefecto = recordatoriosPorDefecto()
const cache = new Map<string, { crudo: string | null; valor: Recordatorio[] }>()

function leer(clave: string): Recordatorio[] {
  let crudo: string | null = null
  try {
    crudo = localStorage.getItem(clave)
  } catch {
    // Sin acceso al almacenamiento (modo privado estricto): valen los de por defecto.
  }
  const previo = cache.get(clave)
  if (previo && previo.crudo === crudo) return previo.valor
  let valor = porDefecto
  if (crudo) {
    try {
      valor = leerRecordatorios(JSON.parse(crudo)) ?? porDefecto
    } catch {
      valor = porDefecto
    }
  }
  cache.set(clave, { crudo, valor })
  return valor
}

function suscribir(avisar: () => void) {
  window.addEventListener('storage', avisar)
  window.addEventListener(CAMBIO, avisar)
  return () => {
    window.removeEventListener('storage', avisar)
    window.removeEventListener(CAMBIO, avisar)
  }
}

export interface OpcionesGuardado {
  /** false para guardar solo en el dispositivo (p. ej. al traer lo del servidor). */
  enNube?: boolean
}

export interface AlmacenRecordatorios {
  recordatorios: Recordatorio[]
  guardar: (recordatorios: Recordatorio[], opciones?: OpcionesGuardado) => void
  alternar: (id: string) => void
}

/** Recordatorios del usuario en este dispositivo, compartidos entre pantallas y pestañas. */
export function useRecordatorios(): AlmacenRecordatorios {
  const auth = useAuth()
  const clave = PREFIJO + (auth.fase === 'autenticado' ? auth.usuario.id : 'demo')
  const recordatorios = useSyncExternalStore(suscribir, () => leer(clave))

  const guardar = useCallback(
    (nuevos: Recordatorio[], { enNube = true }: OpcionesGuardado = {}) => {
      try {
        localStorage.setItem(clave, JSON.stringify(nuevos))
      } catch {
        // Si no se puede guardar, el cambio dura lo que la pestaña.
        cache.set(clave, { crudo: null, valor: nuevos })
      }
      window.dispatchEvent(new Event(CAMBIO))
      if (enNube && repositorios.recordatorios.sincroniza) {
        // Sin red queda lo local; la próxima sincronización al abrir Kalo lo reintenta.
        void repositorios.recordatorios.guardar(nuevos).catch(() => undefined)
      }
    },
    [clave],
  )

  return useMemo(
    () => ({
      recordatorios,
      guardar,
      alternar: (id) =>
        guardar(
          recordatorios.map((recordatorio) =>
            recordatorio.id === id ? { ...recordatorio, activo: !recordatorio.activo } : recordatorio,
          ),
        ),
    }),
    [recordatorios, guardar],
  )
}

export type PermisoAvisos = 'concedido' | 'pendiente' | 'denegado' | 'no-disponible'

export function permisoDeAvisos(): PermisoAvisos {
  if (typeof Notification === 'undefined') return 'no-disponible'
  if (Notification.permission === 'granted') return 'concedido'
  return Notification.permission === 'denied' ? 'denegado' : 'pendiente'
}

/** Pide permiso al navegador; hay que llamarlo desde un gesto del usuario. */
export async function pedirPermisoDeAvisos(): Promise<PermisoAvisos> {
  if (typeof Notification === 'undefined') return 'no-disponible'
  try {
    await Notification.requestPermission()
  } catch {
    // Navegadores antiguos: se queda como estaba.
  }
  return permisoDeAvisos()
}

/** Zona horaria del dispositivo ("America/Bogota"), para que el servidor sepa qué hora es aquí. */
export function zonaHorariaLocal(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

type EstadoCorreo = { fase: 'cargando' } | { fase: 'error' } | { fase: 'listo'; activo: boolean }

export interface AvisosPorCorreo {
  /** false en modo demostración: sin cuenta no hay a dónde enviar el correo. */
  disponible: boolean
  estado: EstadoCorreo
  /** true si el último cambio no se pudo guardar. */
  fallo: boolean
  cambiar: (activo: boolean) => void
}

/** Si los recordatorios también se envían al correo de la cuenta. */
export function useAvisosPorCorreo(): AvisosPorCorreo {
  const disponible = repositorios.recordatorios.sincroniza
  const [estado, setEstado] = useState<EstadoCorreo>(
    disponible ? { fase: 'cargando' } : { fase: 'listo', activo: false },
  )
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    if (!disponible) return
    let vigente = true
    repositorios.recordatorios
      .obtener()
      .then(({ correo }) => {
        if (vigente) setEstado({ fase: 'listo', activo: correo })
      })
      .catch(() => {
        if (vigente) setEstado({ fase: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [disponible])

  const cambiar = useCallback((activo: boolean) => {
    setFallo(false)
    setEstado({ fase: 'listo', activo })
    repositorios.recordatorios.guardarCorreo(activo, zonaHorariaLocal()).catch(() => {
      setFallo(true)
      setEstado({ fase: 'listo', activo: !activo })
    })
  }, [])

  return { disponible, estado, fallo, cambiar }
}
