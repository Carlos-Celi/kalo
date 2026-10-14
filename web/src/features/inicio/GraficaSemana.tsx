import { useState } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { BarChart, type Barra } from '../../components/ui/BarChart'
import { formatoDiaCorto, formatoDecimal, formatoEntero } from '../../domain/formato'
import { estadoAnillo } from '../../domain/reglas'
import type { DiaDeLaSemana, EstadoAnillo } from '../../domain/tipos'

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
  claseRelleno: string
  claseBorde: string
  /** Calorías se pasan a partir del 105 %; el resto solo cumple al llegar a la meta. */
  tipo: 'calorias' | 'habito'
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
    claseRelleno: 'bg-llama',
    claseBorde: 'border-llama',
    tipo: 'calorias',
  },
  proteina: {
    etiqueta: 'Proteína',
    titulo: 'Proteína · últimos 7 días',
    unidad: 'g',
    paso: 20,
    valor: (dia) => dia.proteinaG,
    meta: (metas) => metas.proteinaG,
    formato: formatoEntero,
    claseRelleno: 'bg-sol',
    claseBorde: 'border-sol',
    tipo: 'habito',
  },
  agua: {
    etiqueta: 'Agua',
    titulo: 'Agua · últimos 7 días',
    unidad: 'L',
    paso: 0.5,
    valor: (dia) => dia.aguaL,
    meta: (metas) => metas.aguaL,
    formato: (valor) => formatoDecimal(valor, 2),
    claseRelleno: 'bg-agua-luz',
    claseBorde: 'border-agua-luz',
    tipo: 'habito',
  },
}

const TEXTO_ESTADO: Record<EstadoAnillo, string> = {
  vacio: 'sin registro',
  parcial: 'parcial',
  cumplido: 'cumplido',
  excedido: 'te pasaste',
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
  const barras: Barra[] = dias.map((dia, i) => {
    const valor = config.valor(dia)
    return {
      etiqueta: i === ultimo ? 'Hoy' : formatoDiaCorto(dia.fecha),
      valor,
      destacada: i === ultimo,
      estado: estadoAnillo({ valor, meta }, config.tipo),
      valorTexto: config.formato(valor),
    }
  })
  const maximo = Math.max(meta, ...barras.map((barra) => barra.valor))
  const escala = Math.max(Math.ceil(maximo / config.paso) * config.paso, config.paso)
  const resumen = barras
    .map(
      (barra) =>
        `${barra.etiqueta}: ${config.formato(barra.valor)} ${config.unidad}, ${TEXTO_ESTADO[barra.estado]}`,
    )
    .join('; ')

  return (
    <section
      aria-label="Resumen de la semana"
      className={`flex flex-col gap-3 rounded-tarjeta bg-muro p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className="num-marcador text-[20px] leading-none font-bold uppercase">{config.titulo}</h2>
        <div
          role="group"
          aria-label="Qué mostrar en la gráfica"
          className="grid grid-cols-3 rounded-full bg-sala p-1"
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
                  activa ? 'bg-hueso text-tinta' : 'text-ceniza hover:text-hueso'
                }`}
              >
                {metricas[clave].etiqueta}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-baseline justify-between text-xs font-medium text-ceniza lg:text-[13px]">
        <span>
          Meta {config.formato(meta)} {config.unidad}
        </span>
        <Link to={rutas.progreso} className="flex min-h-11 items-center font-bold text-llama no-underline hover:underline">
          Ver progreso
        </Link>
      </div>

      <BarChart
        // Al cambiar de métrica las barras vuelven a crecer.
        key={metrica}
        barras={barras}
        escala={escala}
        meta={meta}
        claseRelleno={config.claseRelleno}
        claseBorde={config.claseBorde}
        className="h-[132px] lg:h-[184px]"
      />
      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs font-medium text-ceniza">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`size-2.5 rounded-[3px] ${config.claseRelleno}`} />✓ Cumplido
        </span>
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`size-2.5 rounded-[3px] border-[1.5px] border-dashed ${config.claseBorde}`}
          />
          ½ Parcial
        </span>
        {config.tipo === 'calorias' && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-[3px] bg-exceso" />! Te pasaste
          </span>
        )}
      </div>
      <p className="sr-only">{resumen}</p>
    </section>
  )
}
