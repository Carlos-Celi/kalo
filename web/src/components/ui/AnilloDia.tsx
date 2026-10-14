import type { EstadoAnillo } from '../../domain/tipos'
import type { TonoLinea } from './LineaAvance'
import { useEntrada } from './useAnimacion'

const trazos: Record<TonoLinea, string> = {
  llama: 'stroke-llama',
  sol: 'stroke-sol',
  agua: 'stroke-agua-luz',
  ejercicio: 'stroke-ejercicio-luz',
  sueno: 'stroke-sueno-luz',
  peso: 'stroke-peso-luz',
}

const RADIO = 16
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

const SIMBOLO: Record<EstadoAnillo, string> = {
  vacio: '',
  parcial: '½',
  cumplido: '✓',
  excedido: '!',
}

interface Props {
  /** valor / meta, sin tope. */
  razon: number
  estado: EstadoAnillo
  tono: TonoLinea
  /** Un día que ya pasó sin cumplirse: el arco parcial se dibuja discontinuo. */
  pasado?: boolean
  className?: string
}

/**
 * Anillo de progreso de un día (docs/rediseno/guia.md §6). Como la línea de
 * avance, el estado se lee por la forma y el símbolo, no solo por el color:
 * completo con ✓ = cumplido, arco (discontinuo si el día ya pasó) con ½ =
 * parcial, doble anillo con «!» = excedido y punteado = sin registro.
 * Decorativo: quien lo usa da el estado también como texto.
 */
export function AnilloDia({ razon, estado, tono, pasado = false, className = '' }: Props) {
  const avance = useEntrada(Math.min(Math.max(razon, 0), 1))
  const trazo = trazos[tono]
  const discontinua = pasado && estado === 'parcial'
  return (
    <span aria-hidden="true" className={`relative inline-flex size-10 items-center justify-center ${className}`}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full -rotate-90">
        {estado === 'excedido' ? (
          <>
            <circle cx="20" cy="20" r="18" fill="none" strokeWidth="2" className="stroke-exceso" />
            <circle cx="20" cy="20" r="13.5" fill="none" strokeWidth="2" className="stroke-exceso" />
          </>
        ) : (
          <>
            <circle
              cx="20"
              cy="20"
              r={RADIO}
              fill="none"
              strokeWidth={estado === 'vacio' ? 1.5 : 1}
              strokeDasharray={estado === 'vacio' ? '1.5 3.5' : undefined}
              className="stroke-filo"
            />
            {estado !== 'vacio' && (
              <circle
                cx="20"
                cy="20"
                r={RADIO}
                fill="none"
                strokeWidth="3.5"
                strokeLinecap={discontinua ? 'butt' : 'round'}
                strokeDasharray={
                  discontinua ? discontinuo(avance) : `${avance * CIRCUNFERENCIA} ${CIRCUNFERENCIA}`
                }
                className={`${trazo} transition-[stroke-dasharray] duration-[1100ms] ease-(--ease-sala)`}
              />
            )}
          </>
        )}
      </svg>
      <span
        className={`num-marcador relative text-[17px] leading-none font-bold ${
          estado === 'excedido' ? 'text-exceso' : 'text-hueso'
        }`}
      >
        {SIMBOLO[estado]}
      </span>
    </span>
  )
}

/** Trazos de 4 y huecos de 3 hasta cubrir el avance; el resto del círculo queda vacío. */
function discontinuo(avance: number): string {
  const largo = avance * CIRCUNFERENCIA
  const segmentos: number[] = []
  let recorrido = 0
  while (recorrido + 4 <= largo) {
    segmentos.push(4, 3)
    recorrido += 7
  }
  segmentos.push(0, CIRCUNFERENCIA)
  return segmentos.join(' ')
}
