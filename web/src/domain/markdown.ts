/**
 * Subconjunto de Markdown que usa el asistente: títulos, listas, tablas,
 * separadores, párrafos y, en línea, negrita, cursiva y código. No admite HTML:
 * lo que no reconoce se muestra como texto.
 */

export type BloqueMarkdown =
  | { tipo: 'titulo'; nivel: 1 | 2 | 3; texto: string }
  | { tipo: 'parrafo'; texto: string }
  | { tipo: 'lista'; ordenada: boolean; elementos: string[] }
  | { tipo: 'tabla'; cabecera: string[]; filas: string[][] }
  | { tipo: 'separador' }

export type TramoEnLinea = { tipo: 'texto' | 'negrita' | 'cursiva' | 'codigo'; texto: string }

const celdas = (linea: string) =>
  linea
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((celda) => celda.trim())

const esFilaDeTabla = (linea: string) => /^\s*\|.*\|\s*$/.test(linea)
const esSeparadorDeTabla = (linea: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(linea)

export function parsearMarkdown(texto: string): BloqueMarkdown[] {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n')
  const bloques: BloqueMarkdown[] = []
  let parrafo: string[] = []

  const cerrarParrafo = () => {
    if (parrafo.length > 0) bloques.push({ tipo: 'parrafo', texto: parrafo.join('\n') })
    parrafo = []
  }

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i]
    const titulo = /^(#{1,4})\s+(.+?)\s*#*$/.exec(linea)
    const viñeta = /^\s*[-*•]\s+(.+)$/.exec(linea)
    const numerada = /^\s*\d+[.)]\s+(.+)$/.exec(linea)

    if (linea.trim() === '') {
      cerrarParrafo()
    } else if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(linea)) {
      cerrarParrafo()
      bloques.push({ tipo: 'separador' })
    } else if (titulo) {
      cerrarParrafo()
      bloques.push({
        tipo: 'titulo',
        nivel: Math.min(titulo[1].length, 3) as 1 | 2 | 3,
        texto: titulo[2],
      })
    } else if (esFilaDeTabla(linea) && i + 1 < lineas.length && esSeparadorDeTabla(lineas[i + 1])) {
      cerrarParrafo()
      const cabecera = celdas(linea)
      const filas: string[][] = []
      i += 2
      while (i < lineas.length && esFilaDeTabla(lineas[i])) {
        filas.push(celdas(lineas[i]))
        i += 1
      }
      i -= 1
      bloques.push({ tipo: 'tabla', cabecera, filas })
    } else if (viñeta || numerada) {
      cerrarParrafo()
      const ordenada = Boolean(numerada)
      const anterior = bloques.at(-1)
      const elemento = (viñeta ?? numerada)![1]
      if (anterior?.tipo === 'lista' && anterior.ordenada === ordenada) anterior.elementos.push(elemento)
      else bloques.push({ tipo: 'lista', ordenada, elementos: [elemento] })
    } else {
      // Una línea con sangría tras un elemento de lista continúa ese elemento.
      const anterior = bloques.at(-1)
      if (parrafo.length === 0 && anterior?.tipo === 'lista' && /^\s{2,}\S/.test(linea)) {
        anterior.elementos[anterior.elementos.length - 1] += ` ${linea.trim()}`
      } else {
        parrafo.push(linea.trim())
      }
    }
  }
  cerrarParrafo()
  return bloques
}

/** Parte un texto en tramos con su estilo: **negrita**, *cursiva* y `código`. */
export function tramosEnLinea(texto: string): TramoEnLinea[] {
  const tramos: TramoEnLinea[] = []
  const patron = /\*\*([^*]+)\*\*|__([^_]+)__|\*([^*\n]+)\*|`([^`]+)`/g
  let ultimo = 0
  for (const encontrado of texto.matchAll(patron)) {
    if (encontrado.index > ultimo) tramos.push({ tipo: 'texto', texto: texto.slice(ultimo, encontrado.index) })
    if (encontrado[1] !== undefined || encontrado[2] !== undefined) {
      tramos.push({ tipo: 'negrita', texto: encontrado[1] ?? encontrado[2] })
    } else if (encontrado[3] !== undefined) {
      tramos.push({ tipo: 'cursiva', texto: encontrado[3] })
    } else {
      tramos.push({ tipo: 'codigo', texto: encontrado[4] })
    }
    ultimo = encontrado.index + encontrado[0].length
  }
  if (ultimo < texto.length) tramos.push({ tipo: 'texto', texto: texto.slice(ultimo) })
  return tramos
}
