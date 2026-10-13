import type { ReactNode } from 'react'

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
  const lleno = Math.min(Math.max(fraccion, 0), 1) * CIRCUNFERENCIA
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIO} fill="none" strokeWidth="10" className={clasePista} />
        {lleno > 0 && (
          <circle
            cx="50"
            cy="50"
            r={RADIO}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${lleno} ${CIRCUNFERENCIA}`}
            transform="rotate(-90 50 50)"
            className={claseTrazo}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
