import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { MascotAvatar } from '../../components/ui/MascotAvatar'
import { formatoFechaLarga } from '../../domain/formato'
import { CaloriasSemana } from './CaloriasSemana'
import { HabitosGrid } from './HabitosGrid'
import { mensajeDelDia } from './mensajes'
import { MetasHoy } from './MetasHoy'
import { SiguientePaso } from './SiguientePaso'
import { useResumenInicio } from './useResumenInicio'

function AccesoCircular({ to, etiqueta, icono }: { to: string; etiqueta: string; icono: NombreIcono }) {
  return (
    <Link
      to={to}
      aria-label={etiqueta}
      className="flex size-11 items-center justify-center rounded-full border border-borde text-tinta hover:bg-crema-suave"
    >
      <Icon nombre={icono} tamano={20} />
    </Link>
  )
}

export function InicioPage() {
  useTitulo('Inicio')
  const estado = useResumenInicio()

  if (estado.fase === 'cargando') {
    return (
      <p role="status" className="py-10 text-center text-sm font-medium text-tinta-3">
        Cargando tu día…
      </p>
    )
  }

  if (estado.fase === 'error') {
    return (
      <p role="alert" className="py-10 text-center text-sm font-semibold text-error">
        No pudimos cargar tu resumen. Recarga la página para intentarlo de nuevo.
      </p>
    )
  }

  const { resumen } = estado

  return (
    <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-12 lg:gap-5">
      <header className="flex items-center gap-3 lg:col-span-12 lg:mb-2">
        <MascotAvatar tamano={44} alt="Mascota de Kalo" className="lg:hidden" />
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h1 className="text-2xl font-extrabold tracking-[-0.5px] lg:text-[32px] lg:tracking-[-0.8px]">
            {resumen.nombre ? `Hola, ${resumen.nombre}` : 'Hola'}
          </h1>
          <p className="text-[13px] font-medium text-tinta-3 lg:text-[15px]">
            {formatoFechaLarga(resumen.fecha)} · {mensajeDelDia(resumen.calorias)}
          </p>
        </div>
        {/* En escritorio estos accesos viven en la barra lateral. */}
        <div className="flex gap-2 lg:hidden">
          <AccesoCircular to={rutas.recordatorios} etiqueta="Recordatorios" icono="campana" />
          <AccesoCircular to={rutas.ajustes} etiqueta="Configuración" icono="ajustes" />
        </div>
      </header>

      <MetasHoy
        calorias={resumen.calorias}
        proteina={resumen.proteina}
        className="lg:col-span-7"
      />
      <SiguientePaso
        paso={resumen.siguientePaso}
        proteina={resumen.proteina}
        className="lg:col-span-5"
      />
      <HabitosGrid
        agua={resumen.agua}
        ejercicio={resumen.ejercicio}
        sueno={resumen.sueno}
        comidas={resumen.comidas}
        className="lg:col-span-12"
      />
      <CaloriasSemana
        dias={resumen.caloriasSemana}
        meta={resumen.calorias.meta}
        className="lg:col-span-12"
      />
    </div>
  )
}
