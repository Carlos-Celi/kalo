import { formatoPeso } from '../../domain/formato'

interface Props {
  /** Pesos en kg, en orden cronológico. */
  valores: number[]
  /** Línea horizontal de referencia (peso meta), si cabe en la escala. */
  meta?: number
  alto?: number
  /** Marca cada registro con un punto (gráfica de Progreso). */
  conPuntos?: boolean
}

const ANCHO = 320
const MARGEN = 10

/** Evolución del peso: línea con el último punto resaltado. */
export function LineaPeso({ valores, meta, alto = 100, conPuntos = false }: Props) {
  if (valores.length === 0) return null
  const referencia = meta === undefined ? valores : [...valores, meta]
  const minimo = Math.min(...referencia)
  const maximo = Math.max(...referencia)
  const rango = maximo - minimo || 1
  const base = alto - 10
  const x = (i: number) =>
    valores.length === 1 ? ANCHO / 2 : MARGEN + (i * (ANCHO - 2 * MARGEN)) / (valores.length - 1)
  const y = (kg: number) => 14 + ((maximo - kg) / rango) * (base - 28)
  const ultimo = valores.length - 1

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${alto}`}
      width="100%"
      height={alto}
      role="img"
      aria-label={
        valores.length === 1
          ? `Peso: ${formatoPeso(valores[0])} kg`
          : `Peso de ${formatoPeso(valores[0])} a ${formatoPeso(valores[ultimo])} kg en ${valores.length} registros`
      }
    >
      <line x1="0" y1={base} x2={ANCHO} y2={base} className="stroke-borde" />
      {meta !== undefined && (
        <line
          x1="0"
          y1={y(meta)}
          x2={ANCHO}
          y2={y(meta)}
          strokeDasharray="4 4"
          className="stroke-sol"
          strokeWidth="2"
        />
      )}
      <polyline
        points={valores.map((kg, i) => `${x(i)},${y(kg)}`).join(' ')}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={conPuntos ? 'stroke-llama' : 'stroke-kalo'}
      />
      {conPuntos &&
        valores
          .slice(0, -1)
          .map((kg, i) => (
            <circle key={i} cx={x(i)} cy={y(kg)} r="4" strokeWidth="2" className="fill-white stroke-llama" />
          ))}
      <circle
        cx={x(ultimo)}
        cy={y(valores[ultimo])}
        r="6"
        strokeWidth={conPuntos ? 0 : 3}
        className={conPuntos ? 'fill-kalo' : 'fill-llama stroke-white'}
      />
    </svg>
  )
}
