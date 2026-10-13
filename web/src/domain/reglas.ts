import type { Avance, EstadoAnillo } from './tipos'

/** La comida se da por cumplida dentro de esta franja de la meta de calorías. */
export const CALORIAS_MINIMO = 0.9
export const CALORIAS_MAXIMO = 1.05

/** Fracción de la meta alcanzada, entre 0 y 1 (para anillos y barras). */
export function fraccion({ valor, meta }: Avance): number {
  if (meta <= 0 || valor <= 0) return 0
  return Math.min(valor / meta, 1)
}

export function porcentaje(avance: Avance): number {
  return Math.round(fraccion(avance) * 100)
}

/** Cuánto falta para la meta; 0 si ya se alcanzó. */
export function restante({ valor, meta }: Avance): number {
  return Math.max(meta - valor, 0)
}

/**
 * Estado del anillo diario. Solo las calorías pueden quedar "excedido":
 * cumplen entre el 90 % y el 105 % de la meta y se exceden por encima.
 * El resto de hábitos cumplen al llegar a la meta.
 */
export function estadoAnillo(
  { valor, meta }: Avance,
  tipo: 'calorias' | 'habito' = 'habito',
): EstadoAnillo {
  if (meta <= 0 || valor <= 0) return 'vacio'
  const razon = valor / meta
  if (tipo === 'calorias') {
    if (razon > CALORIAS_MAXIMO) return 'excedido'
    return razon >= CALORIAS_MINIMO ? 'cumplido' : 'parcial'
  }
  return razon >= 1 ? 'cumplido' : 'parcial'
}

/** IMC = kg / m². Devuelve null si la estatura no es válida. */
export function imc(pesoKg: number, estaturaCm: number): number | null {
  if (pesoKg <= 0 || estaturaCm <= 0) return null
  const metros = estaturaCm / 100
  return pesoKg / (metros * metros)
}
