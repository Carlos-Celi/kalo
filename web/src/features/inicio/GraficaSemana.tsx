import { useState } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { BarChart, type Barra } from '../../components/ui/BarChart'
import { formatoDiaCorto, formatoDecimal, formatoEntero } from '../../domain/formato'
import type { DiaDeLaSemana } from '../../domain/tipos'

type Metrica = 'calorias' | 'proteina' | 'agua'

interface Config {
  etiqueta: string
  titulo: string
  unidad: string
  /** El eje se redondea hacia arriba a este múltiplo. */
  paso: number
  valor: (dia: DiaDeLaSemana) => number
  meta: (metas: Metas) => number
  formato: (valor: number) => string
  claseDestacada: string
  claseSuave: string
}

interface Metas {
  kcal: number
  proteinaG: number
  aguaL: number
}

const metricas: Record<Metrica, Config> = {
  calorias: {
    etiqueta: 'Calorías',
    titulo: 'Calorías · últimos 7 días',
    unidad: 'kcal',
    paso: 500,
    valor: (dia) => dia.kcal,
    meta: (metas) => metas.kcal,
    formato: formatoEntero,
    claseDestacada: 'bg-kalo',
    claseSuave: 'bg-barra-suave',
  },
  proteina: {
    etiqueta: 'Proteína',
    titulo: 'Proteína · últimos 7 días',
    unidad: 'g',
    paso: 20,
    valor: (dia) => dia.proteinaG,
    meta: (metas) => metas.proteinaG,
    formato: formatoEntero,
    claseDestacada: 'bg-proteina',
    claseSuave: 'bg-proteina-pista',
  },
  agua: {
    etiqueta: 'Agua',
    titulo: 'Agua · últimos 7 días',
    unidad: 'L',
    paso: 0.5,
    valor: (dia) => dia.aguaL,
    meta: (metas) => metas.aguaL,
    formato: (valor) => formatoDecimal(valor, 2),
    claseDestacada: 'bg-agua',
    claseSuave: 'bg-agua-pista',
  },
}

const ORDEN: Metrica[] = ['calorias', 'proteina', 'agua']

interface Props {
  dias: DiaDeLaSemana[]
  metas: Metas
  className?: string
}

/** Barras de los últimos 7 días con selector de calorías, proteína o agua; enlaza a Progreso. */
export function GraficaSemana({ dias, metas, className = '' }: Props) {
  const [metrica, setMetrica] = useState<Metrica>('calorias')
  const config = metricas[metrica]
  const meta = config.meta(metas)

  const ultimo = dias.length - 1
  const barras: Barra[] = dias.map((dia, i) => ({
    etiqueta: i === ultimo ? 'Hoy' : formatoDiaCorto(dia.fecha),
    valor: config.valor(dia),
    destacada: i === ultimo,
  }))
  const maximo = Math.max(meta, ...barras.map((barra) => barra.valor))
  const escala = Math.max(Math.ceil(maximo / config.paso) * config.paso, config.paso)
  const resumen = barras
    .map((barra) => `${barra.etiqueta}: ${config.formato(barra.valor)} ${config.unidad}`)
    .join(', ')

  return (
    <section
      aria-label="Resumen de la semana"
      className={`sombra-suave flex flex-col gap-3 rounded-tarjeta border border-borde bg-white p-4 lg:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="text-[15px] font-extrabold lg:text-[17px]">{config.titulo}</h2>
        <div
          role="group"
          aria-label="Qué mostrar en la gráfica"
          className="grid grid-cols-3 rounded-full bg-arena p-1"
        >
          {ORDEN.map((clave) => {
            const activa = clave === metrica
            return (
              <button
                key={clave}
                type="button"
                aria-pressed={activa}
                onClick={() => setMetrica(clave)}
                className={`h-9 min-w-[76px] rounded-full px-3 text-xs font-bold ${
                  activa ? 'bg-white text-kalo shadow-sm' : 'text-tinta-3 hover:text-tinta'
                }`}
              >
                {metricas[clave].etiqueta}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-baseline justify-between text-xs font-medium text-tinta-3 lg:text-[13px]">
        <span>
          Meta {config.formato(meta)} {config.unidad}
        </span>
        <Link to={rutas.progreso} className="flex min-h-11 items-center font-bold text-kalo no-underline hover:underline">
          Ver progreso
        </Link>
      </div>

      <BarChart
        // Al cambiar de métrica las barras vuelven a crecer.
        key={metrica}
        barras={barras}
        escala={escala}
        meta={meta}
        claseDestacada={config.claseDestacada}
        claseSuave={config.claseSuave}
        className="h-[92px] lg:h-[168px]"
      />
      <p className="sr-only">{resumen}</p>
    </section>
  )
}
