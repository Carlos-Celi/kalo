import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { formatoEntero } from '../../domain/formato'
import { fraccion, porcentaje } from '../../domain/reglas'
import type { Avance } from '../../domain/tipos'
import { mensajeCalorias, mensajeProteina } from './mensajes'

interface AnilloProps {
  nombre: string
  unidad: string
  etiquetaAccesible: string
  avance: Avance
  mensaje: string
  claseTrazo: string
}

function AnilloMeta({ nombre, unidad, etiquetaAccesible, avance, mensaje, claseTrazo }: AnilloProps) {
  return (
    <Link
      to={rutas.registros}
      aria-label={etiquetaAccesible}
      className="flex flex-col items-center gap-2 rounded-2xl text-white no-underline"
    >
      <ProgressRing
        fraccion={fraccion(avance)}
        claseTrazo={claseTrazo}
        className="size-[104px] lg:size-[136px]"
      >
        <span className="text-[22px] leading-none font-extrabold lg:text-[28px]">
          {porcentaje(avance)}%
        </span>
        <span className="text-xs font-semibold text-kalo-claro lg:text-[13px]">{nombre}</span>
      </ProgressRing>
      <div className="text-center">
        <div className="text-[15px] font-extrabold lg:text-[17px]">
          {formatoEntero(avance.valor)}{' '}
          <span className="text-xs font-semibold text-kalo-claro lg:text-[13px]">
            / {formatoEntero(avance.meta)} {unidad}
          </span>
        </div>
        <div className="text-xs font-medium text-kalo-claro lg:text-[13px]">{mensaje}</div>
      </div>
    </Link>
  )
}

interface Props {
  calorias: Avance
  proteina: Avance
  className?: string
}

/** Tarjeta naranja con los dos anillos principales: calorías y proteína. */
export function MetasHoy({ calorias, proteina, className = '' }: Props) {
  return (
    <section
      aria-labelledby="metas-hoy"
      className={`flex flex-col gap-3.5 rounded-tarjeta-lg bg-kalo p-[18px] text-white lg:p-6 ${className}`}
    >
      <div className="flex items-center justify-between">
        <h2 id="metas-hoy" className="text-[13px] font-bold text-kalo-claro lg:text-sm">
          Metas principales de hoy
        </h2>
        <Link
          to={rutas.registros}
          className="-my-3 flex min-h-11 items-center text-xs font-bold text-white no-underline hover:underline lg:text-[13px]"
        >
          Ver comidas
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:my-auto">
        <AnilloMeta
          nombre="calorías"
          unidad="kcal"
          etiquetaAccesible={`Calorías: ${formatoEntero(calorias.valor)} de ${formatoEntero(calorias.meta)}`}
          avance={calorias}
          mensaje={mensajeCalorias(calorias)}
          claseTrazo="stroke-white"
        />
        <AnilloMeta
          nombre="proteína"
          unidad="g"
          etiquetaAccesible={`Proteína: ${formatoEntero(proteina.valor)} de ${formatoEntero(proteina.meta)} gramos`}
          avance={proteina}
          mensaje={mensajeProteina(proteina)}
          claseTrazo="stroke-sol"
        />
      </div>
    </section>
  )
}
