import { useEntrada } from './useAnimacion'

const tonos = {
  calorias: 'bg-[radial-gradient(closest-side,rgb(249_115_22/0.5),transparent)]',
  proteina: 'bg-[radial-gradient(closest-side,rgb(255_201_51/0.32),transparent)]',
  exceso: 'bg-[radial-gradient(closest-side,rgb(255_106_85/0.28),transparent)]',
} as const

interface Props {
  /** valor / meta, sin tope. */
  razon: number
  tono: 'calorias' | 'proteina'
  excedido?: boolean
}

/**
 * Resplandor detrás de un panel de meta (docs/rediseno/guia.md §5). La luz es
 * un dato: crece con el avance, no existe sin registro y con exceso se atenúa
 * y se vuelve rojiza. El panel que la contiene debe ser `relative isolate
 * overflow-hidden`.
 */
export function LuzSala({ razon, tono, excedido = false }: Props) {
  const p = useEntrada(excedido ? 0.45 : Math.min(Math.max(razon, 0), 1))
  if (razon <= 0) return null
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -bottom-[40%] left-1/2 -z-10 aspect-[1.4] w-[150%] rounded-full transition-[transform,opacity] duration-[1100ms] ease-(--ease-sala) ${
        excedido ? tonos.exceso : tonos[tono]
      }`}
      style={{ transform: `translateX(-50%) scale(${0.35 + p * 0.75})`, opacity: 0.12 + p * 0.88 }}
    />
  )
}
