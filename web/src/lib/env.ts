export interface ConfigSupabase {
  url: string
  clave: string
}

type Entorno = Record<string, string | boolean | undefined>

const HOSTS_LOCALES = new Set(['localhost', '127.0.0.1'])

function texto(valor: string | boolean | undefined): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** Rol declarado en una clave con formato JWT; null si no lo es. */
function rolDeJwt(clave: string): string | null {
  const partes = clave.split('.')
  if (partes.length !== 3) return null
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const carga: unknown = JSON.parse(atob(base64))
    if (typeof carga === 'object' && carga !== null && 'role' in carga) {
      return typeof carga.role === 'string' ? carga.role : null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Lee la configuración de Supabase de las variables `VITE_*`.
 * Devuelve null si no hay ninguna (modo demostración, sin cuentas).
 *
 * Todo lo que llega aquí queda incrustado en el JavaScript público, así que
 * se rechaza cualquier clave privilegiada: delante de la base de datos solo
 * puede ir la clave publishable/anon, y la protección real es RLS.
 */
export function leerConfigSupabase(env: Entorno = import.meta.env): ConfigSupabase | null {
  const url = texto(env.VITE_SUPABASE_URL)
  const clave = texto(env.VITE_SUPABASE_PUBLISHABLE_KEY)

  if (!url && !clave) return null
  if (!url || !clave) {
    throw new Error(
      'Configuración incompleta: define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY, o ninguna.',
    )
  }

  let destino: URL
  try {
    destino = new URL(url)
  } catch {
    throw new Error('VITE_SUPABASE_URL no es una URL válida.')
  }
  const esLocal = HOSTS_LOCALES.has(destino.hostname)
  if (destino.protocol !== 'https:' && !(esLocal && destino.protocol === 'http:')) {
    throw new Error('VITE_SUPABASE_URL debe usar https (http solo se admite en local).')
  }

  if (clave.startsWith('sb_secret_') || rolDeJwt(clave) === 'service_role') {
    throw new Error(
      'VITE_SUPABASE_PUBLISHABLE_KEY contiene una clave secreta. En el navegador solo puede ir la clave publishable/anon: retírala y rótala.',
    )
  }

  return { url: destino.origin, clave }
}

/** Clave pública del sitio de Cloudflare Turnstile; vacío si no hay CAPTCHA. */
export function leerClaveTurnstile(env: Entorno = import.meta.env): string {
  return texto(env.VITE_TURNSTILE_SITE_KEY)
}

/**
 * Correo de contacto para privacidad (opcional, público por diseño: aparece en
 * la política). Solo se acepta si parece un correo.
 */
export function leerContactoPrivacidad(env: Entorno = import.meta.env): string | null {
  const valor = texto(env.VITE_CONTACTO_PRIVACIDAD)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? valor : null
}
