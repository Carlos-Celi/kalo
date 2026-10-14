import { Link, NavLink } from 'react-router'
import { rutas } from '../../app/rutas'
import { usePerfil } from '../../features/perfil/contexto'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { MascotAvatar } from '../ui/MascotAvatar'
import { entradasNav, type EntradaNav } from './navegacion'

const secundarias: EntradaNav[] = [
  { ruta: rutas.recordatorios, etiqueta: 'Recordatorios', icono: 'campana' },
  { ruta: rutas.ajustes, etiqueta: 'Configuración', icono: 'ajustes' },
]

function Entrada({ ruta, etiqueta, icono, exacta }: EntradaNav) {
  return (
    <li>
      <NavLink
        to={ruta}
        end={exacta}
        className={({ isActive }) =>
          `flex h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] no-underline ${
            isActive
              ? 'bg-muro font-bold text-llama'
              : 'font-semibold text-ceniza hover:bg-muro hover:text-hueso'
          }`
        }
      >
        <Icon nombre={icono} />
        {etiqueta}
      </NavLink>
    </li>
  )
}

/** Navegación lateral de la vista de escritorio (sustituye al tab bar). */
export function Sidebar({ className = '' }: { className?: string }) {
  const { perfil } = usePerfil()
  const nombre = perfil.plan?.datos.nombre ?? perfil.nombre
  return (
    <nav
      aria-label="Navegación principal"
      className={`sticky top-0 h-dvh flex-col gap-6 border-r border-divisor bg-sala px-4 py-6 ${className}`}
    >
      <Link
        to={rutas.inicio}
        aria-label="Kalo, ir a Inicio"
        className="flex items-center gap-3 px-2 text-hueso no-underline"
      >
        <MascotAvatar tamano={44} />
        <span className="num-marcador text-[32px] leading-none font-extrabold">kalo</span>
      </Link>

      <ul className="flex flex-col gap-1">
        {entradasNav.map((entrada) => (
          <Entrada key={entrada.ruta} {...entrada} />
        ))}
      </ul>

      {/* Debajo de las secciones principales: la acción rápida cierra el grupo. */}
      <Button to={rutas.registroRapido} tamano="lg" className="-mt-2 gap-2">
        <Icon nombre="mas" tamano={20} grosor={2.4} />
        Registro rápido
      </Button>

      <ul className="mt-auto flex flex-col gap-1 border-t border-divisor pt-4">
        {secundarias.map((entrada) => (
          <Entrada key={entrada.ruta} {...entrada} />
        ))}
      </ul>

      {nombre && (
        <Link
          to={rutas.ajustesPerfil}
          className="flex items-center gap-3 rounded-boton-sm bg-muro px-3 py-2.5 text-hueso no-underline hover:bg-banco"
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brasa text-sm font-extrabold text-white"
          >
            {nombre.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-extrabold">{nombre}</span>
            <span className="text-xs font-medium text-ceniza">Ver mi perfil</span>
          </span>
        </Link>
      )}
    </nav>
  )
}
