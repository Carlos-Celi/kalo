import { formatoDecimal, formatoDuracion, formatoEntero } from '../../domain/formato'
import { estadoAnillo, fraccion, restante } from '../../domain/reglas'
import type { Avance, Habito } from '../../domain/tipos'

const META_CUMPLIDA = 'Meta cumplida'

/** A partir de esta fracción el mensaje pasa de "Faltan…" a "Casi: falta…". */
const CASI = 0.8

export function mensajeDelDia(calorias: Avance): string {
  return estadoAnillo(calorias, 'calorias') === 'excedido'
    ? 'te pasaste de calorías hoy'
    : 'vas bien hoy'
}

export function mensajeCalorias(calorias: Avance): string {
  if (calorias.valor > calorias.meta) {
    return `Te pasaste por ${formatoEntero(calorias.valor - calorias.meta)}`
  }
  const quedan = restante(calorias)
  return quedan === 0 ? META_CUMPLIDA : `Te quedan ${formatoEntero(quedan)}`
}

export function mensajeProteina(proteina: Avance): string {
  const faltan = restante(proteina)
  return faltan === 0 ? META_CUMPLIDA : `Faltan ${formatoEntero(faltan)} g`
}

/** "1,6 / 2,5 L", "35 / 60 min", "6 h 45 / 8 h", "3 / 5" */
export function valorHabito(habito: Habito, { valor, meta }: Avance): string {
  switch (habito) {
    case 'agua':
      return `${formatoDecimal(valor)} / ${formatoDecimal(meta, 2)} L`
    case 'ejercicio':
      return `${formatoEntero(valor)} / ${formatoEntero(meta)} min`
    case 'sueno':
      return `${formatoDuracion(valor)} / ${formatoDuracion(meta)}`
    case 'comidas':
      return `${formatoEntero(valor)} / ${formatoEntero(meta)}`
  }
}

/** Las partes del valor de un hábito, para dibujarlas a tamaño de marcador: "1,6" + "L". */
export function partesHabito(
  habito: Habito,
  { valor, meta }: Avance,
): { valor: string; unidad: string; meta: string } {
  switch (habito) {
    case 'agua':
      return { valor: formatoDecimal(valor), unidad: 'L', meta: `${formatoDecimal(meta, 2)} L` }
    case 'ejercicio':
      return { valor: formatoEntero(valor), unidad: 'min', meta: `${formatoEntero(meta)} min` }
    case 'sueno':
      return { valor: formatoDuracion(valor), unidad: '', meta: formatoDuracion(meta) }
    case 'comidas':
      return { valor: formatoEntero(valor), unidad: `/ ${formatoEntero(meta)}`, meta: formatoEntero(meta) }
  }
}

export function mensajeHabito(habito: Habito, avance: Avance): string {
  const faltan = restante(avance)
  if (faltan === 0) return META_CUMPLIDA
  switch (habito) {
    case 'agua':
      return `Faltan ${formatoDecimal(faltan)} L`
    case 'ejercicio':
      return `Faltan ${formatoEntero(faltan)} min`
    case 'sueno':
      return fraccion(avance) >= CASI
        ? `Casi: falta ${formatoDuracion(faltan)}`
        : `Faltan ${formatoDuracion(faltan)}`
    case 'comidas':
      return faltan === 1 ? 'Falta 1 por registrar' : `Faltan ${formatoEntero(faltan)} por registrar`
  }
}
