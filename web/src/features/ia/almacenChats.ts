import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { guardarChat, leerChats, quitarChat, type Chat } from '../../domain/chats'
import { useAuth } from '../auth/contexto'

// Los chats del asistente se guardan en este dispositivo, por usuario: nunca
// viajan a Kalo ni a Supabase. Solo se conservan los tres más recientes.
const PREFIJO = 'kalo:chats:'
const CAMBIO = 'kalo:chats'

const cache = new Map<string, { crudo: string | null; valor: Chat[] }>()
const vacio: Chat[] = []

function leer(clave: string): Chat[] {
  let crudo: string | null = null
  try {
    crudo = localStorage.getItem(clave)
  } catch {
    // Sin almacenamiento disponible los chats duran lo que la pestaña.
  }
  const previo = cache.get(clave)
  if (previo && previo.crudo === crudo) return previo.valor
  let valor = vacio
  if (crudo) {
    try {
      valor = leerChats(JSON.parse(crudo))
    } catch {
      valor = vacio
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

export interface AlmacenChats {
  /** Del más reciente al más antiguo. */
  chats: Chat[]
  /** Crea o actualiza un chat; si hay más de tres, se descarta el menos reciente. */
  guardar: (chat: Chat) => void
  borrar: (id: string) => void
}

export function useChats(): AlmacenChats {
  const auth = useAuth()
  const clave = PREFIJO + (auth.fase === 'autenticado' ? auth.usuario.id : 'demo')
  const chats = useSyncExternalStore(suscribir, () => leer(clave))

  const escribir = useCallback(
    (nuevos: Chat[]) => {
      try {
        localStorage.setItem(clave, JSON.stringify(nuevos))
      } catch {
        // Si no se puede guardar, el cambio dura lo que la pestaña.
        cache.set(clave, { crudo: null, valor: nuevos })
      }
      window.dispatchEvent(new Event(CAMBIO))
    },
    [clave],
  )

  return useMemo(
    () => ({
      chats,
      guardar: (chat) => escribir(guardarChat(leer(clave), chat)),
      borrar: (id) => escribir(quitarChat(leer(clave), id)),
    }),
    [chats, clave, escribir],
  )
}
