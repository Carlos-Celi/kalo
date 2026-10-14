import type { Habito } from '../domain/tipos'

/**
 * El último hábito que se registró en esta sesión, para que Inicio lo resalte
 * ("Nuevo") hasta que la persona lo mira. Vive en memoria: no se persiste.
 */
type Oyente = () => void

let actual: Habito | null = null
const oyentes = new Set<Oyente>()

export function marcarUltimoRegistro(habito: Habito | null): void {
  if (actual === habito) return
  actual = habito
  oyentes.forEach((oyente) => oyente())
}

export function ultimoRegistro(): Habito | null {
  return actual
}

export function suscribirUltimoRegistro(oyente: Oyente): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
