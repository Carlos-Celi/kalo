import type { ReactNode } from 'react'
import { useEntrada } from './useAnimacion'

const RADIO = 40
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

interface Props {
  /** Avance entre 0 y 1. */
  fraccion: number
  /** Clases de color del trazo, p. ej. `stroke-white`. */
  claseTrazo: string
  clasePista?: string
  className?: string
  children?: ReactNode
}

/** Anillo de progreso decorativo; quien lo usa aporta la etiqueta accesible. */
export function ProgressRing({
  fraccion,
  claseTrazo,
  clasePista = 'stroke-anillo-pista',
  className = '',
  children,
}: Props) {
  const meta = Math.min(Math.max(fraccion, 0), 1)
  const lleno = useEntrada(meta) * CIRCUNFERENCIA
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIO} fill="none" strokeWidth="10" className={clasePista} />
        {meta > 0 && (
          <circle
            cx="50"
            cy="50"
            r={RADIO}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${lleno} ${CIRCUNFERENCIA}`}
            transform="rotate(-90 50 50)"
            className={`${claseTrazo} transition-[stroke-dasharray] duration-[900ms] ease-out`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
