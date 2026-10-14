import type { EstadoAnillo } from '../../domain/tipos'

export interface Barra {
  etiqueta: string
  valor: number
  /** Hoy: va con su valor encima y resplandor. */
  destacada?: boolean
  estado: EstadoAnillo
  /** Texto que se muestra encima de la barra de hoy. */
  valorTexto?: string
}

interface Props {
  barras: Barra[]
  /** Valor que corresponde a la altura completa del gráfico. */
  escala: number
  /** Dibuja una línea de 1 px a esa altura (la meta). */
  meta?: number
  /** Color de las barras cumplidas (`bg-llama`) y de su borde si son parciales (`border-llama`). */
  claseRelleno?: string
  claseBorde?: string
  className?: string
}

const SIMBOLO: Record<EstadoAnillo, string> = {
  vacio: '',
  parcial: '½',
  cumplido: '✓',
  excedido: '!',
}

/**
 * Barras verticales con su eje de etiquetas. El estado se lee por la forma
 * (sólida = cumplido, borde discontinuo = parcial, rojo con «!» = excedido) y
 * por su símbolo (docs/rediseno/guia.md §6). Es decorativo: el componente que
 * lo usa debe ofrecer los mismos datos como texto accesible. Las barras crecen
 * al aparecer; cambiar la `key` del gráfico repite la animación.
 */
export function BarChart({
  barras,
  escala,
  meta,
  claseRelleno = 'bg-llama',
  claseBorde = 'border-llama',
  className = 'h-[92px]',
}: Props) {
  const columnas = { gridTemplateColumns: `repeat(${barras.length}, minmax(0, 1fr))` }
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      <div className={`relative pt-5 ${className}`}>
        {meta !== undefined && meta > 0 && meta <= escala && (
          <div
            className="absolute inset-x-0 h-px bg-hueso"
            style={{ bottom: `calc((100% - 1.25rem) * ${meta / escala})` }}
          />
        )}
        <div className="grid h-full items-end gap-1.5 border-b border-filo" style={columnas}>
          {barras.map((barra, i) => {
            const altura = `${Math.min(barra.valor / escala, 1) * 100}%`
            const excedido = barra.estado === 'excedido'
            const parcialPasado = barra.estado === 'parcial' && !barra.destacada
            const forma = excedido
              ? 'bg-exceso'
              : parcialPasado || barra.estado === 'vacio'
                ? `border-[1.5px] border-dashed bg-transparent ${claseBorde}`
                : `${claseRelleno} ${barra.destacada && barra.estado !== 'cumplido' ? 'opacity-55' : ''}`
            return (
              <div key={barra.etiqueta} className="flex h-full flex-col items-center justify-end">
                <span
                  className={`num-marcador mb-0.5 text-[13px] leading-none font-bold whitespace-nowrap ${
                    excedido ? 'text-exceso' : barra.destacada ? 'text-hueso' : 'text-ceniza'
                  }`}
                >
                  {barra.destacada && barra.valorTexto ? barra.valorTexto : SIMBOLO[barra.estado]}
                </span>
                <div
                  className={`mx-auto w-full max-w-14 origin-bottom animate-crecer rounded-md ${forma} ${
                    barra.destacada ? 'shadow-[0_0_14px_-2px_rgb(249_115_22/0.55)]' : ''
                  }`}
                  style={{ height: altura, animationDelay: `${i * 60}ms` }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="grid gap-1.5 text-center text-xs font-semibold text-ceniza" style={columnas}>
        {barras.map((barra) => (
          <span key={barra.etiqueta} className={barra.destacada ? 'font-extrabold text-hueso' : ''}>
            {barra.etiqueta}
          </span>
        ))}
      </div>
    </div>
  )
}
