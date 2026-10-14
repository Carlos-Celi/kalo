import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { ErrorCarga } from '../../components/ui/ErrorCarga'
import { Esqueleto } from '../../components/ui/Esqueleto'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { MascotAvatar } from '../../components/ui/MascotAvatar'
import { formatoFechaLarga } from '../../domain/formato'
import { GraficaSemana } from './GraficaSemana'
import { HabitosGrid } from './HabitosGrid'
import { mensajeDelDia } from './mensajes'
import { estadoAnillo } from '../../domain/reglas'
import type { Avance } from '../../domain/tipos'
import { MetasHoy } from './MetasHoy'
import { SiguientePaso } from './SiguientePaso'
import { useResumenInicio } from './useResumenInicio'

function AccesoCircular({ to, etiqueta, icono }: { to: string; etiqueta: string; icono: NombreIcono }) {
  return (
    <Link
      to={to}
      aria-label={etiqueta}
      className="flex size-11 items-center justify-center rounded-full border border-filo text-hueso hover:bg-muro"
    >
      <Icon nombre={icono} tamano={20} />
    </Link>
  )
}

/** Kalo es la fuente de luz: brilla con el promedio de las dos metas, y poco si hay exceso. */
function brilloDeKalo(calorias: Avance, proteina: Avance): number {
  if (estadoAnillo(calorias, 'calorias') === 'excedido') return 0.25
  const razon = ({ valor, meta }: Avance) => (meta > 0 ? Math.min(valor / meta, 1) : 0)
  return (razon(calorias) + razon(proteina)) / 2
}

export function InicioPage() {
  useTitulo('Inicio')
  const estado = useResumenInicio()

  if (estado.fase === 'cargando') {
    return (
      <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-12 lg:gap-5">
        <p role="status" className="sr-only">
          Cargando tu día…
        </p>
        <Esqueleto className="h-11 w-56 lg:col-span-12" />
        <Esqueleto className="h-[250px] lg:col-span-8 lg:h-[190px]" />
        <Esqueleto className="h-[190px] lg:col-span-4 lg:row-span-3 lg:h-[280px]" />
        <Esqueleto className="h-[76px] lg:col-span-8" />
        <div className="grid grid-cols-2 gap-1.5 lg:col-span-8 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  if (estado.fase === 'error') {
    return <ErrorCarga mensaje="No pudimos cargar tu resumen." />
  }

  const { resumen } = estado

  return (
    <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-12 lg:gap-5">
      <header className="flex items-center gap-3 lg:col-span-12 lg:mb-2">
        <MascotAvatar tamano={50} alt="Mascota de Kalo" brillo={brilloDeKalo(resumen.calorias, resumen.proteina)} className="lg:hidden" />
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <h1 className="text-xl font-bold tracking-[-0.3px] lg:text-[32px] lg:font-extrabold lg:tracking-[-0.8px]">
            {resumen.nombre ? `Hola, ${resumen.nombre}` : 'Hola'}
          </h1>
          <p className="text-[13px] font-medium text-ceniza lg:text-[15px]">
            {formatoFechaLarga(resumen.fecha)} · {mensajeDelDia(resumen.calorias)}
          </p>
        </div>
        {/* En escritorio estos accesos viven en la barra lateral. */}
        <div className="flex gap-2 lg:hidden">
          <AccesoCircular to={rutas.recordatorios} etiqueta="Recordatorios" icono="campana" />
          <AccesoCircular to={rutas.ajustes} etiqueta="Configuración" icono="ajustes" />
        </div>
      </header>

      <div className="flex flex-col gap-3.5 lg:col-span-8">
        <MetasHoy calorias={resumen.calorias} proteina={resumen.proteina} />
        <SiguientePaso paso={resumen.siguientePaso} proteina={resumen.proteina} />
        <HabitosGrid
          agua={resumen.agua}
          ejercicio={resumen.ejercicio}
          sueno={resumen.sueno}
          comidas={resumen.comidas}
        />
      </div>
      <GraficaSemana
        dias={resumen.semana}
        metas={{
          kcal: resumen.calorias.meta,
          proteinaG: resumen.proteina.meta,
          aguaL: resumen.agua.meta,
        }}
        className="lg:col-span-4 lg:self-start"
      />
    </div>
  )
}
