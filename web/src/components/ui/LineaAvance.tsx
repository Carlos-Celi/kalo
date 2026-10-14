import type { EstadoAnillo } from '../../domain/tipos'
import { useEntrada } from './useAnimacion'

export type TonoLinea = 'llama' | 'sol' | 'agua' | 'ejercicio' | 'sueno' | 'peso'

const tonos: Record<TonoLinea, { relleno: string; borde: string }> = {
  llama: { relleno: 'bg-llama', borde: 'border-llama' },
  sol: { relleno: 'bg-sol', borde: 'border-sol' },
  agua: { relleno: 'bg-agua-luz', borde: 'border-agua-luz' },
  ejercicio: { relleno: 'bg-ejercicio-luz', borde: 'border-ejercicio-luz' },
  sueno: { relleno: 'bg-sueno-luz', borde: 'border-sueno-luz' },
  peso: { relleno: 'bg-peso-luz', borde: 'border-peso-luz' },
}

/** El riel mide de 0 a 105 % de la meta, así que la marca de meta cae en 100/105. */
const TOPE = 1.05

interface Props {
  /** valor / meta, sin tope (1,2 = 120 % de la meta). */
  razon: number
  estado: EstadoAnillo
  tono: TonoLinea
  /** Un día que ya pasó sin cumplirse: el avance parcial se dibuja discontinuo. */
  pasado?: boolean
  className?: string
}

/**
 * Línea de avance hacia una meta (docs/rediseno/guia.md §6). El estado se lee
 * por su forma: sólida = cumplido, discontinua = parcial de un día pasado,
 * doble = excedido y punteada = sin registro. Es decorativa (`aria-hidden`):
 * quien la usa ofrece el estado también como texto.
 */
export function LineaAvance({ razon, estado, tono, pasado = false, className = '' }: Props) {
  const ancho = useEntrada(Math.min(Math.max(razon / TOPE, 0), 1))
  const { relleno, borde } = tonos[tono]
  const excedido = estado === 'excedido'
  const vacio = estado === 'vacio'
  return (
    <div aria-hidden="true" className={`relative h-[13px] ${className}`}>
      {vacio ? (
        <span className="absolute inset-x-0 top-1/2 border-t border-dotted border-filo" />
      ) : (
        <span className="absolute inset-x-0 top-1/2 h-px bg-filo" />
      )}
      {excedido && (
        <>
          <span className="absolute inset-x-0 top-[3px] h-0.5 bg-exceso" />
          <span className="absolute inset-x-0 bottom-[3px] h-0.5 bg-exceso" />
        </>
      )}
      {!excedido && !vacio && (
        <span
          className={`absolute top-1/2 left-0 -translate-y-1/2 transition-[width] duration-[1100ms] ease-(--ease-sala) ${
            pasado && estado === 'parcial'
              ? `h-0 border-t-[3px] border-dashed ${borde}`
              : `h-[3px] rounded-full ${relleno}`
          }`}
          style={{ width: `${ancho * 100}%` }}
        />
      )}
      <span
        className="absolute top-0 h-[13px] w-px bg-hueso"
        style={{ left: `${(1 / TOPE) * 100}%` }}
      />
    </div>
  )
}
