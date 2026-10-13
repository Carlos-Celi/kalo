export interface Barra {
  etiqueta: string
  valor: number
  destacada?: boolean
}

interface Props {
  barras: Barra[]
  /** Valor que corresponde a la altura completa del gráfico. */
  escala: number
  className?: string
}

/**
 * Barras verticales con su eje de etiquetas. Es decorativo: el componente
 * que lo usa debe ofrecer los mismos datos como texto accesible.
 */
export function BarChart({ barras, escala, className = 'h-[92px]' }: Props) {
  const columnas = { gridTemplateColumns: `repeat(${barras.length}, minmax(0, 1fr))` }
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className={`grid items-end gap-2.5 ${className}`} style={columnas}>
        {barras.map((barra) => (
          <div
            key={barra.etiqueta}
            className={`mx-auto w-full max-w-18 rounded-md ${barra.destacada ? 'bg-kalo' : 'bg-barra-suave'}`}
            style={{ height: `${Math.min(barra.valor / escala, 1) * 100}%` }}
          />
        ))}
      </div>
      <div className="grid gap-2.5 text-center text-xs font-medium text-tinta-3" style={columnas}>
        {barras.map((barra) => (
          <span key={barra.etiqueta} className={barra.destacada ? 'font-extrabold text-kalo' : ''}>
            {barra.etiqueta}
          </span>
        ))}
      </div>
    </div>
  )
}
