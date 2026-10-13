import type { ClaveDia } from '../../domain/fechas'
import type { TipoComida } from '../../domain/registros'
import type { Foto } from './proveedores/tipos'

/** Lado mayor de la imagen que se envía a la IA: suficiente para reconocer un plato. */
const LADO_MAXIMO = 1280
const CALIDAD_JPEG = 0.85

export interface FotoTomada {
  foto: Foto
  /** La misma imagen, lista para pintarla en un lienzo. */
  lienzo: HTMLCanvasElement
  tipo: TipoComida
  fecha: ClaveDia
}

// La foto viaja de Cámara a Análisis en memoria y se envía al proveedor de IA
// elegido. Solo si la persona lo deja activado se guarda, además, una
// miniatura ultracomprimida con la comida (comprimirMiniatura).
let pendiente: FotoTomada | null = null

export function dejarFoto(foto: FotoTomada | null): void {
  pendiente = foto
}

export function fotoPendiente(): FotoTomada | null {
  return pendiente
}

/** Reduce la imagen y la codifica en JPEG para enviarla. */
export function prepararFoto(
  fuente: CanvasImageSource,
  ancho: number,
  alto: number,
): { foto: Foto; lienzo: HTMLCanvasElement } | null {
  if (ancho <= 0 || alto <= 0) return null
  const escala = Math.min(1, LADO_MAXIMO / Math.max(ancho, alto))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(ancho * escala)
  lienzo.height = Math.round(alto * escala)
  const contexto = lienzo.getContext('2d')
  if (!contexto) return null
  contexto.drawImage(fuente, 0, 0, lienzo.width, lienzo.height)
  const [, base64] = lienzo.toDataURL('image/jpeg', CALIDAD_JPEG).split(',')
  return base64 ? { foto: { base64, tipoMime: 'image/jpeg' }, lienzo } : null
}

/** Lados mayores que se prueban, de más a menos, hasta que la miniatura cabe. */
const LADOS_MINIATURA = [480, 400, 320, 256]
const CALIDADES_MINIATURA = [0.5, 0.4, 0.3]
/** Tope de caracteres del texto: bastante por debajo del límite de la base de datos. */
const MAXIMO_CARACTERES = 70_000

/**
 * Miniatura ultracomprimida de la foto, como data URL: WebP si el navegador
 * lo codifica (≈10–30 KB a 480 px) y JPEG si no. Null si no se puede.
 */
export function comprimirMiniatura(origen: HTMLCanvasElement): string | null {
  try {
    if (origen.width <= 0 || origen.height <= 0) return null
    for (const lado of LADOS_MINIATURA) {
      const escala = Math.min(1, lado / Math.max(origen.width, origen.height))
      const lienzo = document.createElement('canvas')
      lienzo.width = Math.max(1, Math.round(origen.width * escala))
      lienzo.height = Math.max(1, Math.round(origen.height * escala))
      const contexto = lienzo.getContext('2d')
      if (!contexto) return null
      contexto.drawImage(origen, 0, 0, lienzo.width, lienzo.height)
      for (const calidad of CALIDADES_MINIATURA) {
        // Un navegador sin codificador WebP devuelve PNG: entonces se usa JPEG.
        let url = lienzo.toDataURL('image/webp', calidad)
        if (!url.startsWith('data:image/webp;base64,')) url = lienzo.toDataURL('image/jpeg', calidad)
        if (/^data:image\/(webp|jpeg);base64,/.test(url) && url.length <= MAXIMO_CARACTERES) return url
      }
    }
  } catch {
    // Sin lienzo disponible no hay miniatura: la comida se guarda igual.
  }
  return null
}

/** Pinta una miniatura guardada en un lienzo (sin abrir la CSP a imágenes `data:`). */
export async function pintarMiniatura(url: string, destino: HTMLCanvasElement): Promise<boolean> {
  const coincidencia = /^data:(image\/(?:webp|jpeg));base64,(.+)$/.exec(url)
  if (!coincidencia) return false
  try {
    const bytes = Uint8Array.from(atob(coincidencia[2]), (caracter) => caracter.charCodeAt(0))
    const imagen = await createImageBitmap(new Blob([bytes], { type: coincidencia[1] }))
    destino.width = imagen.width
    destino.height = imagen.height
    destino.getContext('2d')?.drawImage(imagen, 0, 0)
    imagen.close()
    return true
  } catch {
    return false
  }
}

/** Tamaño aproximado en KB de una miniatura (data URL en base64). */
export function kilobytesDe(url: string): number {
  return Math.max(1, Math.round((url.length * 0.75) / 1024))
}
