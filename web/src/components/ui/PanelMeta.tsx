import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { formatoEntero } from '../../domain/formato'
import { estadoAnillo } from '../../domain/reglas'
import type { Avance, EstadoAnillo } from '../../domain/tipos'
import { LineaAvance } from './LineaAvance'
import { LuzSala } from './LuzSala'

interface Props {
  nombre: 'Calorías' | 'Proteína'
  tono: 'calorias' | 'proteina'
  unidad: 'kcal' | 'g'
  avance: Avance
  /** Texto de lo que queda: "Te quedan 660", "Faltan 88 g"… */
  mensaje: string
  className?: string
}

function textoEstado(estado: EstadoAnillo, porcentaje: number): string {
  switch (estado) {
    case 'vacio':
      return 'Sin registro'
    case 'cumplido':
      return `✓ ${porcentaje} %`
    case 'excedido':
      return `! ${porcentaje} %`
    case 'parcial':
      return `${porcentaje} %`
  }
}

/**
 * Meta principal del día: el número a tamaño de marcador, su línea de avance y
 * la luz de sala detrás (docs/rediseno/guia.md §5-§7). Enlaza a Registros.
 */
export function PanelMeta({ nombre, tono, unidad, avance, mensaje, className = '' }: Props) {
  const estado = estadoAnillo(avance, tono === 'calorias' ? 'calorias' : 'habito')
  const razon = avance.meta > 0 ? avance.valor / avance.meta : 0
  const porcentaje = Math.round(razon * 100)
  const excedido = estado === 'excedido'
  const detalle = `${formatoEntero(avance.valor)} de ${formatoEntero(avance.meta)} ${unidad}`
  return (
    <Link
      to={rutas.registros}
      aria-label={`${nombre}: ${detalle}, ${porcentaje} %. ${mensaje}`}
      className={`relative isolate block overflow-hidden rounded-tarjeta bg-muro p-4 text-hueso no-underline lg:p-5 ${className}`}
    >
      <LuzSala razon={razon} tono={tono} excedido={excedido} />
      <div className="flex justify-between gap-2 text-[13px] font-semibold text-ceniza">
        <span>{nombre}</span>
        <span>
          meta <span className="num-marcador text-sm">{formatoEntero(avance.meta)}</span>
          {unidad === 'g' ? ' g' : ''}
        </span>
      </div>
      <div
        className={`num-marcador mt-2 text-[88px] leading-[0.86] font-extrabold lg:text-[96px] ${
          tono === 'proteina' ? 'text-sol' : 'text-hueso'
        }`}
      >
        {formatoEntero(avance.valor)}
        <span className="ml-1 text-[28px] font-bold text-ceniza">{unidad}</span>
      </div>
      <LineaAvance razon={razon} estado={estado} tono={tono === 'proteina' ? 'sol' : 'llama'} className="mt-3" />
      <div className="mt-1.5 flex justify-between gap-2 text-[13px] font-semibold">
        <span className={excedido ? 'text-exceso' : 'text-hueso'}>{textoEstado(estado, porcentaje)}</span>
        <span className="text-ceniza">{mensaje}</span>
      </div>
    </Link>
  )
}
