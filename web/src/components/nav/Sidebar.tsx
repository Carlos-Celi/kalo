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
          `flex h-12 items-center gap-3 rounded-2xl px-3.5 text-[15px] no-underline ${
            isActive
              ? 'bg-crema font-extrabold text-kalo-oscuro'
              : 'font-semibold text-tinta-2 hover:bg-crema-suave'
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
      className={`sticky top-0 h-dvh flex-col gap-6 border-r border-borde bg-white px-4 py-6 ${className}`}
    >
      <Link
        to={rutas.inicio}
        aria-label="Kalo, ir a Inicio"
        className="flex items-center gap-3 px-2 text-tinta no-underline"
      >
        <MascotAvatar tamano={44} />
        <span className="text-[30px] leading-none font-extrabold tracking-[-1.5px]">kalo</span>
      </Link>

      <Button to={rutas.registroRapido} tamano="lg" className="gap-2">
        <Icon nombre="mas" tamano={20} grosor={2.4} />
        Registro rápido
      </Button>

      <ul className="flex flex-col gap-1">
        {entradasNav.map((entrada) => (
          <Entrada key={entrada.ruta} {...entrada} />
        ))}
      </ul>

      <ul className="mt-auto flex flex-col gap-1 border-t border-borde pt-4">
        {secundarias.map((entrada) => (
          <Entrada key={entrada.ruta} {...entrada} />
        ))}
      </ul>

      {nombre && (
        <Link
          to={rutas.ajustesPerfil}
          className="flex items-center gap-3 rounded-2xl bg-crema-suave px-3 py-2.5 text-tinta no-underline hover:bg-crema"
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-kalo text-sm font-extrabold text-white"
          >
            {nombre.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-extrabold">{nombre}</span>
            <span className="text-xs font-medium text-tinta-3">Ver mi perfil</span>
          </span>
        </Link>
      )}
    </nav>
  )
}
