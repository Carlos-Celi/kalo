import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { BarChart, type Barra } from '../../components/ui/BarChart'
import { formatoDiaCorto, formatoEntero } from '../../domain/formato'
import type { CaloriasDia } from '../../domain/tipos'

/** El eje se redondea hacia arriba a este múltiplo (el diseño usa 2.000). */
const PASO_ESCALA = 500

interface Props {
  dias: CaloriasDia[]
  meta: number
  className?: string
}

/** Barras de calorías de los últimos 7 días; enlaza a Progreso. */
export function CaloriasSemana({ dias, meta, className = '' }: Props) {
  const ultimo = dias.length - 1
  const barras: Barra[] = dias.map((dia, i) => ({
    etiqueta: i === ultimo ? 'Hoy' : formatoDiaCorto(dia.fecha),
    valor: dia.kcal,
    destacada: i === ultimo,
  }))
  const maximo = Math.max(meta, ...dias.map((dia) => dia.kcal))
  const escala = Math.ceil(maximo / PASO_ESCALA) * PASO_ESCALA
  const resumen = barras
    .map((barra) => `${barra.etiqueta}: ${formatoEntero(barra.valor)} kcal`)
    .join(', ')

  return (
    <Link
      to={rutas.progreso}
      className={`flex flex-col gap-3 rounded-tarjeta border border-borde p-4 text-tinta no-underline hover:bg-crema-suave lg:p-6 ${className}`}
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-extrabold lg:text-[17px]">Calorías · últimos 7 días</h2>
        <span className="text-xs font-medium text-tinta-3 lg:text-[13px]">
          Meta {formatoEntero(meta)}
        </span>
      </div>
      <BarChart barras={barras} escala={escala} className="h-[92px] lg:h-[168px]" />
      <p className="sr-only">{resumen}</p>
    </Link>
  )
}
