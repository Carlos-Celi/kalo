export interface Barra {
  etiqueta: string
  valor: number
  destacada?: boolean
}

interface Props {
  barras: Barra[]
  /** Valor que corresponde a la altura completa del gráfico. */
  escala: number
  /** Si se indica, dibuja una línea discontinua a esa altura (la meta). */
  meta?: number
  /** Clases de color de la barra destacada y de las demás. */
  claseDestacada?: string
  claseSuave?: string
  className?: string
}

/**
 * Barras verticales con su eje de etiquetas. Es decorativo: el componente
 * que lo usa debe ofrecer los mismos datos como texto accesible. Las barras
 * crecen al aparecer; cambiar la `key` del gráfico repite la animación.
 */
export function BarChart({
  barras,
  escala,
  meta,
  claseDestacada = 'bg-kalo',
  claseSuave = 'bg-barra-suave',
  className = 'h-[92px]',
}: Props) {
  const columnas = { gridTemplateColumns: `repeat(${barras.length}, minmax(0, 1fr))` }
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      <div className={`relative ${className}`}>
        {meta !== undefined && meta > 0 && meta <= escala && (
          <div
            className="absolute inset-x-0 border-t-[1.5px] border-dashed border-borde-fuerte"
            style={{ bottom: `${(meta / escala) * 100}%` }}
          />
        )}
        <div className="grid h-full items-end gap-2.5" style={columnas}>
          {barras.map((barra, i) => (
            <div
              key={barra.etiqueta}
              className={`mx-auto w-full max-w-18 origin-bottom animate-crecer rounded-md ${
                barra.destacada ? claseDestacada : claseSuave
              }`}
              style={{
                height: `${Math.min(barra.valor / escala, 1) * 100}%`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
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
