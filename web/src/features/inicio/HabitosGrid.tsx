import { useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import {
  marcarUltimoRegistro,
  suscribirUltimoRegistro,
  ultimoRegistro,
} from '../../data/ultimoRegistro'
import { LineaAvance, type TonoLinea } from '../../components/ui/LineaAvance'
import { estadoAnillo } from '../../domain/reglas'
import type { Avance, Habito } from '../../domain/tipos'
import { mensajeHabito, partesHabito, valorHabito } from './mensajes'

interface Estilo {
  nombre: string
  ruta: string
  tono: TonoLinea
  claseValor: string
}

const estilos: Record<Habito, Estilo> = {
  agua: { nombre: 'Agua', ruta: rutas.registrosAgua, tono: 'agua', claseValor: 'text-agua-luz' },
  ejercicio: {
    nombre: 'Ejercicio',
    ruta: rutas.registrosEjercicio,
    tono: 'ejercicio',
    claseValor: 'text-ejercicio-luz',
  },
  sueno: { nombre: 'Sueño', ruta: rutas.registrosSueno, tono: 'sueno', claseValor: 'text-sueno-luz' },
  comidas: { nombre: 'Comidas', ruta: rutas.registros, tono: 'llama', claseValor: 'text-llama' },
}

function Mosaico({ habito, avance }: { habito: Habito; avance: Avance }) {
  const estilo = estilos[habito]
  const partes = partesHabito(habito, avance)
  const razon = avance.meta > 0 ? avance.valor / avance.meta : 0
  // Lo último que se registró queda resaltado hasta que la persona lo mira.
  const ultimo = useSyncExternalStore(suscribirUltimoRegistro, ultimoRegistro)
  const nuevo = ultimo === habito
  const visto = () => {
    if (nuevo) marcarUltimoRegistro(null)
  }
  return (
    <div
      onPointerEnter={visto}
      onFocusCapture={visto}
      className={`flex flex-col gap-2 rounded-boton-sm border bg-muro p-3 text-hueso transition-[border-color,box-shadow] duration-[600ms] ${
        nuevo
          ? 'border-llama shadow-[0_0_24px_-6px_rgb(249_115_22/0.6)]'
          : 'border-transparent hover:border-filo'
      }`}
    >
      <Link
        to={estilo.ruta}
        onClick={visto}
        className="flex flex-col gap-1 text-hueso no-underline hover:text-hueso"
      >
        <span className="flex items-baseline justify-between gap-2 text-xs font-semibold text-ceniza">
          <span>{estilo.nombre}</span>
          {nuevo ? (
            <span className="text-[11px] font-bold tracking-[0.04em] text-llama uppercase">Nuevo</span>
          ) : (
            <span aria-hidden="true">{partes.meta}</span>
          )}
        </span>
        <span className="sr-only">{valorHabito(habito, avance)}</span>
        <span
          aria-hidden="true"
          className={`num-marcador text-[28px] leading-[1.05] font-bold ${estilo.claseValor}`}
        >
          {partes.valor}
          {partes.unidad && (
            <span className="ml-1 text-[15px] font-semibold text-ceniza">{partes.unidad}</span>
          )}
        </span>
        <LineaAvance
          razon={razon}
          estado={estadoAnillo(avance)}
          tono={estilo.tono}
          className="mt-1"
        />
        <span className="text-xs text-ceniza">{mensajeHabito(habito, avance)}</span>
      </Link>
    </div>
  )
}

interface Props {
  agua: Avance
  ejercicio: Avance
  sueno: Avance
  comidas: Avance
  className?: string
}

/** Resumen de registros de hoy: cuatro mosaicos, 2×2 en móvil y una fila en escritorio. */
export function HabitosGrid({
  agua,
  ejercicio,
  sueno,
  comidas,
  className = '',
}: Props) {
  return (
    <section
      aria-labelledby="registros-de-hoy"
      className={`flex flex-col gap-2 ${className}`}
    >
      <div className="flex items-baseline justify-between">
        <h2 id="registros-de-hoy" className="num-marcador text-[22px] font-bold uppercase">
          Registros de hoy
        </h2>
        <Link to={rutas.registros} className="flex min-h-11 items-center text-[13px] font-semibold text-ceniza no-underline hover:text-hueso">
          Ver todo
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">
      <Mosaico habito="agua" avance={agua} />
      <Mosaico habito="ejercicio" avance={ejercicio} />
      <Mosaico habito="sueno" avance={sueno} />
      <Mosaico habito="comidas" avance={comidas} />
      </div>
    </section>
  )
}
