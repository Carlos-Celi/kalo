interface Props {
  /** Avance entre 0 y 1. */
  fraccion: number
  claseRelleno: string
  clasePista: string
}

/** Barra fina decorativa; el valor ya se muestra como texto junto a ella. */
export function ProgressBar({ fraccion, claseRelleno, clasePista }: Props) {
  const ancho = `${Math.round(Math.min(Math.max(fraccion, 0), 1) * 100)}%`
  return (
    <div className={`h-[5px] rounded-[3px] ${clasePista}`} aria-hidden="true">
      <div className={`h-[5px] rounded-[3px] ${claseRelleno}`} style={{ width: ancho }} />
    </div>
  )
}
