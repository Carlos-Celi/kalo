import {
  ErrorIA,
  motivoDeEstado,
  type AnalisisComida,
  type MensajeChat,
  type ModeloIA,
  type MotivoFalloIA,
} from '../../../domain/ia'

export interface Foto {
  /** Imagen en base64, sin el prefijo `data:`. */
  base64: string
  tipoMime: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * Lo que Kalo necesita de un proveedor de IA. Cada implementación habla
 * directamente con el proveedor desde el navegador, con la clave del usuario:
 * la clave no pasa por ningún servidor de Kalo. Todos los métodos rechazan
 * con `ErrorIA`, nunca con el mensaje del proveedor.
 */
export interface ClienteIA {
  /** Modelos disponibles para esta clave. También sirve para probar la conexión. */
  listarModelos(): Promise<ModeloIA[]>
  analizarFoto(modelo: string, foto: Foto, indicacion: string): Promise<AnalisisComida>
  /**
   * Envía la conversación y devuelve la respuesta completa. `alRecibir`
   * recibe el texto acumulado a medida que llega.
   */
  conversar(
    modelo: string,
    sistema: string,
    mensajes: MensajeChat[],
    alRecibir: (acumulado: string) => void,
    senal?: AbortSignal,
  ): Promise<string>
}

/**
 * `fetch` que convierte fallos de red y respuestas de error en `ErrorIA`.
 * `motivoPropio` permite a un proveedor afinar el motivo con el cuerpo del
 * error (solo para clasificarlo: su texto nunca se muestra ni se registra).
 */
export async function pedir(
  url: string,
  opciones: RequestInit,
  motivoPropio?: (estado: number, cuerpo: unknown) => { motivo: MotivoFalloIA | null; codigo?: string },
): Promise<Response> {
  let respuesta: Response
  try {
    // Sin credenciales ni referente: al proveedor solo le llega lo imprescindible.
    respuesta = await fetch(url, { ...opciones, credentials: 'omit', referrerPolicy: 'no-referrer' })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ErrorIA('red')
  }
  if (!respuesta.ok) {
    const cuerpo: unknown = motivoPropio ? await respuesta.json().catch(() => null) : null
    const propio = motivoPropio?.(respuesta.status, cuerpo)
    throw new ErrorIA(
      propio?.motivo ?? motivoDeEstado(respuesta.status),
      [`HTTP ${respuesta.status}`, propio?.codigo].filter(Boolean).join(' · '),
    )
  }
  return respuesta
}

export async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return (await respuesta.json()) as unknown
  } catch {
    throw new ErrorIA('respuesta')
  }
}

/** Recorre los eventos `data:` de una respuesta SSE, ya interpretados como JSON. */
export async function* eventosSse(respuesta: Response): AsyncGenerator<unknown> {
  if (!respuesta.body) throw new ErrorIA('respuesta')
  const lector = respuesta.body.pipeThrough(new TextDecoderStream()).getReader()
  let pendiente = ''
  for (;;) {
    const { value, done } = await lector.read()
    if (done) break
    pendiente += value
    const lineas = pendiente.split(/\r?\n/)
    pendiente = lineas.pop() ?? ''
    for (const linea of lineas) {
      if (!linea.startsWith('data:')) continue
      const dato = linea.slice(5).trim()
      if (!dato || dato === '[DONE]') continue
      try {
        yield JSON.parse(dato) as unknown
      } catch {
        // Un evento incompleto no invalida el resto de la respuesta.
      }
    }
  }
}

/** Acceso tolerante a propiedades de un JSON desconocido. */
export function campo(objeto: unknown, ...ruta: (string | number)[]): unknown {
  let actual = objeto
  for (const clave of ruta) {
    if (typeof actual !== 'object' || actual === null) return undefined
    actual = (actual as Record<string | number, unknown>)[clave]
  }
  return actual
}
