import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { fraccion } from '../../domain/reglas'
import type { Avance, Habito } from '../../domain/tipos'
import { mensajeHabito, valorHabito } from './mensajes'

interface Estilo {
  nombre: string
  ruta: string
  icono: NombreIcono
  claseIcono: string
  claseMensaje: string
  claseRelleno: string
  clasePista: string
}

const estilos: Record<Habito, Estilo> = {
  agua: {
    nombre: 'Agua',
    ruta: rutas.registrosAgua,
    icono: 'gota',
    claseIcono: 'bg-agua-suave text-agua',
    claseMensaje: 'text-agua-fuerte',
    claseRelleno: 'bg-agua',
    clasePista: 'bg-agua-suave',
  },
  ejercicio: {
    nombre: 'Ejercicio',
    ruta: rutas.registrosEjercicio,
    icono: 'llama',
    claseIcono: 'bg-ejercicio-suave text-ejercicio',
    claseMensaje: 'text-ejercicio-fuerte',
    claseRelleno: 'bg-ejercicio',
    clasePista: 'bg-ejercicio-suave',
  },
  sueno: {
    nombre: 'Sueño',
    ruta: rutas.registrosSueno,
    icono: 'luna',
    claseIcono: 'bg-sueno-suave text-sueno',
    claseMensaje: 'text-sueno',
    claseRelleno: 'bg-sueno',
    clasePista: 'bg-sueno-suave',
  },
  comidas: {
    nombre: 'Comidas',
    ruta: rutas.registros,
    icono: 'cubiertos',
    claseIcono: 'bg-crema text-kalo',
    claseMensaje: 'text-kalo-oscuro',
    claseRelleno: 'bg-llama',
    clasePista: 'bg-crema',
  },
}

function Mosaico({ habito, avance }: { habito: Habito; avance: Avance }) {
  const estilo = estilos[habito]
  return (
    <Link
      to={estilo.ruta}
      className="flex flex-col gap-2.5 rounded-tarjeta border border-borde p-3.5 text-tinta no-underline hover:bg-crema-suave lg:p-[18px]"
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex size-[34px] shrink-0 items-center justify-center rounded-full ${estilo.claseIcono}`}
        >
          <Icon nombre={estilo.icono} tamano={17} />
        </span>
        <div className="min-w-0">
          <div className="text-xs font-medium text-tinta-3">{estilo.nombre}</div>
          <div className="text-[15px] font-extrabold">{valorHabito(habito, avance)}</div>
          <div className={`text-xs font-semibold ${estilo.claseMensaje}`}>
            {mensajeHabito(habito, avance)}
          </div>
        </div>
      </div>
      <ProgressBar
        fraccion={fraccion(avance)}
        claseRelleno={estilo.claseRelleno}
        clasePista={estilo.clasePista}
      />
    </Link>
  )
}

interface Props {
  agua: Avance
  ejercicio: Avance
  sueno: Avance
  comidas: Avance
  className?: string
}

/** Cuatro mosaicos de hábitos: 2×2 en móvil, una fila en escritorio. */
export function HabitosGrid({ agua, ejercicio, sueno, comidas, className = '' }: Props) {
  return (
    <section
      aria-label="Hábitos de hoy"
      className={`grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-5 ${className}`}
    >
      <Mosaico habito="agua" avance={agua} />
      <Mosaico habito="ejercicio" avance={ejercicio} />
      <Mosaico habito="sueno" avance={sueno} />
      <Mosaico habito="comidas" avance={comidas} />
    </section>
  )
}
