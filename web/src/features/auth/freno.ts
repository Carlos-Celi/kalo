/**
 * Freno progresivo de intentos de inicio de sesión en el cliente.
 * Es una cortesía para el usuario y para el servidor: el límite que de verdad
 * protege la cuenta lo aplica Supabase, porque este se puede saltar.
 */

export interface EstadoFreno {
  fallos: number
  /** Marca de tiempo (ms) hasta la que no se permite reintentar. */
  bloqueadoHasta: number
}

export const INTENTOS_LIBRES = 5
const ESPERA_BASE_MS = 30_000
const ESPERA_MAXIMA_MS = 15 * 60_000

const CLAVE = 'kalo.freno-login'

export const FRENO_INICIAL: EstadoFreno = { fallos: 0, bloqueadoHasta: 0 }

/** A partir del quinto fallo seguido: 30 s, 1 min, 2 min… hasta 15 min. */
export function trasFallo(estado: EstadoFreno, ahora: number): EstadoFreno {
  const fallos = estado.fallos + 1
  if (fallos < INTENTOS_LIBRES) return { fallos, bloqueadoHasta: 0 }
  const espera = Math.min(ESPERA_BASE_MS * 2 ** (fallos - INTENTOS_LIBRES), ESPERA_MAXIMA_MS)
  return { fallos, bloqueadoHasta: ahora + espera }
}

export function segundosDeEspera(estado: EstadoFreno, ahora: number): number {
  return Math.max(Math.ceil((estado.bloqueadoHasta - ahora) / 1000), 0)
}

export function leerFreno(): EstadoFreno {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return FRENO_INICIAL
    const dato: unknown = JSON.parse(crudo)
    if (
      typeof dato === 'object' &&
      dato !== null &&
      'fallos' in dato &&
      'bloqueadoHasta' in dato &&
      typeof dato.fallos === 'number' &&
      typeof dato.bloqueadoHasta === 'number'
    ) {
      return { fallos: dato.fallos, bloqueadoHasta: dato.bloqueadoHasta }
    }
  } catch {
    // Almacenamiento no disponible o dato corrupto: se parte de cero.
  }
  return FRENO_INICIAL
}

export function guardarFreno(estado: EstadoFreno): void {
  try {
    if (estado.fallos === 0) sessionStorage.removeItem(CLAVE)
    else sessionStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    // Sin almacenamiento el freno solo dura lo que la página abierta.
  }
}
