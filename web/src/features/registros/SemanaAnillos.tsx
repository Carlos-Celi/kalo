import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { MascotAvatar } from '../../components/ui/MascotAvatar'
import { formatoDiaCorto } from '../../domain/formato'
import { deClave, formatoDiaMes, type ClaveDia } from '../../domain/fechas'
import type { Metas } from '../../domain/perfil'
import type { Seccion } from '../../domain/registros'
import type { EstadoAnillo } from '../../domain/tipos'
import { secciones } from './secciones'

export interface DiaSemana {
  fecha: ClaveDia
  /** Porcentaje de la meta, sin tope (un exceso puede pasar de 100). */
  porcentaje: number
  estado: EstadoAnillo
}

interface Props {
  seccion: Seccion
  dias: DiaSemana[]
  hoy: ClaveDia
  seleccionado: ClaveDia
  onSeleccionar: (fecha: ClaveDia) => void
  metas: Metas
  /** Racha de días cumplidos: va en la misma tarjeta para no apilar bloques en móvil. */
  racha: { titulo: string; detalle: string }
}

const textoEstado: Record<EstadoAnillo, string> = {
  vacio: 'sin registros',
  parcial: 'parcial',
  cumplido: 'cumplido',
  excedido: 'te pasaste de la meta',
}

/**
 * Racha y anillos de los siete días: cumplido, parcial o excedido. Cada día se puede abrir.
 * La leyenda y la nota de la meta van plegadas en móvil; desde 1024 px siempre se ven.
 */
export function SemanaAnillos({ seccion, dias, hoy, seleccionado, onSeleccionar, metas, racha }: Props) {
  const estilo = secciones[seccion]
  const [verAyuda, setVerAyuda] = useState(false)
  const cumplidos = dias.filter((dia) => dia.estado === 'cumplido').length

  return (
    <section
      aria-label="Progreso de la semana"
      className="flex flex-col gap-2 rounded-[20px] border border-borde px-2.5 pt-2.5 pb-1.5"
    >
      <div className="flex items-center gap-2.5 rounded-boton bg-crema px-2.5 py-2">
        <MascotAvatar tamano={36} />
        <div className="min-w-0 grow">
          <div className="text-[13px] font-extrabold text-kalo-oscuro">{racha.titulo}</div>
          <div className="text-xs leading-[1.35] font-medium text-tinta-2">{racha.detalle}</div>
        </div>
      </div>

      <div className="flex items-baseline justify-between px-1.5 pt-1">
        <h2 className="text-[15px] font-extrabold">{estilo.tituloSemana}</h2>
        <span className="text-xs font-bold text-tinta-3">{cumplidos} de 7 días cumplidos</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {dias.map((dia) => {
          const esHoy = dia.fecha === hoy
          const elegido = dia.fecha === seleccionado
          const excedido = dia.estado === 'excedido'
          const cumplido = dia.estado === 'cumplido'
          const etiqueta = esHoy ? 'Hoy' : formatoDiaCorto(deClave(dia.fecha))
          return (
            <button
              key={dia.fecha}
              type="button"
              aria-pressed={elegido}
              aria-label={`${esHoy ? 'Hoy' : formatoDiaMes(dia.fecha)}: ${dia.porcentaje} %, ${textoEstado[dia.estado]}`}
              onClick={() => onSeleccionar(dia.fecha)}
              className={`flex flex-col items-center gap-1.5 rounded-boton pt-2 pb-1.5 ${elegido ? 'bg-crema' : ''}`}
            >
              <span
                className={`text-xs ${elegido ? 'font-extrabold text-kalo-oscuro' : 'font-semibold text-tinta-3'}`}
              >
                {etiqueta}
              </span>
              <span
                className={`flex size-[38px] items-center justify-center rounded-full text-white ${
                  excedido ? 'bg-error' : cumplido ? estilo.claseAnillo : ''
                }`}
                style={
                  excedido || cumplido
                    ? undefined
                    : {
                        background: `conic-gradient(${estilo.colorAnillo} ${Math.min(dia.porcentaje, 100) * 3.6}deg, var(--color-borde) 0)`,
                      }
                }
              >
                {cumplido && <Icon nombre="check" tamano={18} grosor={3} />}
                {excedido && <span className="text-[17px] font-extrabold">!</span>}
                {!cumplido && !excedido && (
                  <span className={`size-7 rounded-full ${elegido ? 'bg-crema' : 'bg-white'}`} />
                )}
              </span>
              <span
                className={`text-xs font-bold ${
                  excedido ? 'text-error' : cumplido ? 'text-tinta' : 'text-tinta-3'
                }`}
              >
                {dia.porcentaje}%
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        aria-expanded={verAyuda}
        aria-controls="semana-ayuda"
        onClick={() => setVerAyuda((actual) => !actual)}
        className="mx-1.5 flex min-h-11 items-center gap-1.5 self-start text-xs font-bold text-kalo-oscuro lg:hidden"
      >
        <span
          aria-hidden="true"
          className="flex size-5 items-center justify-center rounded-full border border-kalo-oscuro text-[11px]"
        >
          i
        </span>
        {verAyuda ? 'Ocultar cómo se cuenta' : '¿Cómo se cuenta?'}
      </button>
      <div
        id="semana-ayuda"
        className={`${verAyuda ? 'flex' : 'hidden'} flex-col gap-2 pb-1.5 lg:flex`}
      >
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 px-1.5 text-xs font-medium text-tinta-2">
          <span className="flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${estilo.claseAnillo}`} />
            Cumplido
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full border-2 border-borde"
              style={{ borderTopColor: estilo.colorAnillo }}
            />
            Parcial
          </span>
          {seccion === 'comida' && (
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-error" />
              Te pasaste
            </span>
          )}
        </div>
        <p className="px-1.5 text-xs font-medium text-tinta-3">{estilo.notaMeta(metas)}</p>
      </div>
    </section>
  )
}
