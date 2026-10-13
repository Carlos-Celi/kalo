import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { ErrorIA, leerConfigIA, type ConfigIA, type Proveedor } from '../../domain/ia'
import { useAuth } from '../auth/contexto'
import { borrarSecreto, guardarSecreto, leerSecreto } from './boveda'
import type { ClienteIA } from './proveedores/tipos'

// Aquí solo se guarda lo que no es secreto (proveedor y modelo), por usuario.
// La API key va cifrada en la bóveda del dispositivo (boveda.ts) y solo se
// envía a su proveedor: nunca se registra en consola ni llega a Supabase.
const PREFIJO = 'kalo:ia:'
const CAMBIO = 'kalo:ia'

const cache = new Map<string, { crudo: string | null; valor: ConfigIA | null }>()

function leer(clave: string): ConfigIA | null {
  let crudo: string | null = null
  try {
    crudo = localStorage.getItem(clave)
  } catch {
    // Sin almacenamiento disponible no hay configuración que recordar.
  }
  const previo = cache.get(clave)
  if (previo && previo.crudo === crudo) return previo.valor
  let valor: ConfigIA | null = null
  if (crudo) {
    try {
      valor = leerConfigIA(JSON.parse(crudo))
    } catch {
      valor = null
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

export interface AlmacenIA {
  /** null si aún no se ha configurado un proveedor. */
  config: ConfigIA | null
  guardar: (config: ConfigIA, apiKey: string) => Promise<void>
  borrar: () => Promise<void>
  /** La API key guardada en este dispositivo, o null si no hay. */
  leerClave: () => Promise<string | null>
  /** Cliente listo para usar; rechaza con ErrorIA("clave") si falta la configuración o la clave. */
  cliente: () => Promise<ClienteIA>
}

export function useConfigIA(): AlmacenIA {
  const auth = useAuth()
  const usuario = auth.fase === 'autenticado' ? auth.usuario.id : 'demo'
  const clave = PREFIJO + usuario
  const config = useSyncExternalStore(suscribir, () => leer(clave))

  const guardar = useCallback(
    async (nueva: ConfigIA, apiKey: string) => {
      await guardarSecreto(usuario, apiKey)
      const crudo = JSON.stringify(nueva)
      try {
        localStorage.setItem(clave, crudo)
      } catch {
        // Sin almacenamiento, la configuración dura lo que la pestaña.
        cache.set(clave, { crudo: null, valor: nueva })
      }
      window.dispatchEvent(new Event(CAMBIO))
    },
    [clave, usuario],
  )

  const borrar = useCallback(async () => {
    await borrarSecreto(usuario)
    try {
      localStorage.removeItem(clave)
    } catch {
      // Nada que borrar.
    }
    cache.delete(clave)
    window.dispatchEvent(new Event(CAMBIO))
  }, [clave, usuario])

  const leerClave = useCallback(() => leerSecreto(usuario), [usuario])

  const cliente = useCallback(async () => {
    const apiKey = config ? await leerSecreto(usuario) : null
    if (!config || !apiKey) throw new ErrorIA('clave')
    return crearClienteIA(config.proveedor, apiKey)
  }, [config, usuario])

  return useMemo(
    () => ({ config, guardar, borrar, leerClave, cliente }),
    [config, guardar, borrar, leerClave, cliente],
  )
}

/** Cliente del proveedor elegido. Cada uno se descarga solo cuando hace falta. */
export async function crearClienteIA(proveedor: Proveedor, apiKey: string): Promise<ClienteIA> {
  switch (proveedor) {
    case 'anthropic':
      return (await import('./proveedores/anthropic')).crearClienteAnthropic(apiKey)
    case 'openai':
      return (await import('./proveedores/openai')).crearClienteOpenAI(apiKey)
    case 'google':
      return (await import('./proveedores/google')).crearClienteGoogle(apiKey)
  }
}
