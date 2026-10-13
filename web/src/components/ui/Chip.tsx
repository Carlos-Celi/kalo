import type { ReactNode } from 'react'

interface Props {
  seleccionado?: boolean
  onClick?: () => void
  children: ReactNode
}

/** Píldora seleccionable (p. ej. tipo de comida). Mínimo táctil de 44 px. */
export function Chip({ seleccionado = false, onClick, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1 rounded-full px-3.5 text-[13px] ${
        seleccionado
          ? 'bg-kalo font-bold text-white'
          : 'border border-borde bg-white font-semibold text-tinta'
      }`}
    >
      {seleccionado && <span aria-hidden="true">✓</span>}
      {children}
    </button>
  )
}
