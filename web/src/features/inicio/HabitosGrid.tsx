import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { fraccion } from '../../domain/reglas'
import type { Avance, Habito } from '../../domain/tipos'
import { mensajeHabito, valorHabito } from './mensajes'

/** Cantidad del atajo de agua: un vaso. */
const VASO_ML = 250

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

function Mosaico({ habito, avance, pie }: { habito: Habito; avance: Avance; pie?: ReactNode }) {
  const estilo = estilos[habito]
  return (
    <div className="sombra-suave flex flex-col gap-2.5 rounded-tarjeta border border-borde bg-white p-3.5 text-tinta transition hover:border-barra-suave lg:p-[18px]">
      <Link to={estilo.ruta} className="flex flex-col gap-2.5 text-tinta no-underline hover:text-tinta">
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
      {pie}
    </div>
  )
}

interface AtajoAguaProps {
  onAgregar: (ml: number) => Promise<boolean>
  onDeshacer: () => Promise<boolean>
}

/** "+250 ml" sin salir de Inicio, con deshacer del último vaso añadido desde aquí. */
function AtajoAgua({ onAgregar, onDeshacer }: AtajoAguaProps) {
  const [anadidos, setAnadidos] = useState(0)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; fallo: boolean } | null>(null)

  async function agregar() {
    setOcupado(true)
    const guardado = await onAgregar(VASO_ML)
    setOcupado(false)
    if (guardado) setAnadidos((actual) => actual + 1)
    setAviso(
      guardado
        ? { texto: `Se añadieron ${VASO_ML} ml de agua.`, fallo: false }
        : { texto: 'No pudimos guardar. Inténtalo de nuevo.', fallo: true },
    )
  }

  async function deshacer() {
    setOcupado(true)
    const quitado = await onDeshacer()
    setOcupado(false)
    if (quitado) setAnadidos((actual) => Math.max(actual - 1, 0))
    setAviso(
      quitado
        ? { texto: 'Se quitó el último registro de agua.', fallo: false }
        : { texto: 'No pudimos deshacerlo. Inténtalo de nuevo.', fallo: true },
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className={`grid gap-2 ${anadidos > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button
          type="button"
          disabled={ocupado}
          onClick={() => void agregar()}
          className="h-11 rounded-boton-sm bg-agua-suave px-1 text-xs font-extrabold whitespace-nowrap text-agua-fuerte hover:bg-agua-pista disabled:opacity-60"
        >
          +{VASO_ML} ml
        </button>
        {anadidos > 0 && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => void deshacer()}
            className="h-11 rounded-boton-sm border border-agua-pista px-1 text-xs font-bold text-agua-fuerte hover:bg-agua-fondo disabled:opacity-60"
          >
            Deshacer
          </button>
        )}
      </div>
      <p
        role="status"
        className={aviso?.fallo ? 'text-xs font-semibold text-error' : 'sr-only'}
      >
        {aviso?.texto}
      </p>
    </div>
  )
}

interface Props {
  agua: Avance
  ejercicio: Avance
  sueno: Avance
  comidas: Avance
  /** Sin estas acciones el mosaico de agua es solo un enlace. */
  onAgregarAgua?: (ml: number) => Promise<boolean>
  onDeshacerAgua?: () => Promise<boolean>
  className?: string
}

/** Cuatro mosaicos de hábitos: 2×2 en móvil, una fila en escritorio. */
export function HabitosGrid({
  agua,
  ejercicio,
  sueno,
  comidas,
  onAgregarAgua,
  onDeshacerAgua,
  className = '',
}: Props) {
  return (
    <section
      aria-label="Hábitos de hoy"
      className={`grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-5 ${className}`}
    >
      <Mosaico
        habito="agua"
        avance={agua}
        pie={
          onAgregarAgua && onDeshacerAgua ? (
            <AtajoAgua onAgregar={onAgregarAgua} onDeshacer={onDeshacerAgua} />
          ) : undefined
        }
      />
      <Mosaico habito="ejercicio" avance={ejercicio} />
      <Mosaico habito="sueno" avance={sueno} />
      <Mosaico habito="comidas" avance={comidas} />
    </section>
  )
}
