import { Link, NavLink } from 'react-router'
import { rutas } from '../../app/rutas'
import { Icon } from '../ui/Icon'
import { entradasNav, type EntradaNav } from './navegacion'

function Pestana({ ruta, etiqueta, icono, exacta }: EntradaNav) {
  return (
    <NavLink
      to={ruta}
      end={exacta}
      className={({ isActive }) =>
        `mx-0.5 flex h-[52px] flex-col items-center justify-center gap-[3px] rounded-boton-sm text-xs no-underline ${
          isActive ? 'font-bold text-llama' : 'font-semibold text-ceniza-2'
        }`
      }
    >
      <Icon nombre={icono} />
      {etiqueta}
    </NavLink>
  )
}

/** Navegación inferior de la vista móvil. */
export function TabBar({ className = '' }: { className?: string }) {
  const [inicio, registros, asistente, progreso] = entradasNav
  return (
    <nav
      aria-label="Navegación principal"
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-divisor bg-tabbar/92 backdrop-blur-md ${className}`}
    >
      <div className="mx-auto grid max-w-[480px] grid-cols-5 items-center px-1.5 pt-1 pb-[max(8px,env(safe-area-inset-bottom))]">
        <Pestana {...inicio} />
        <Pestana {...registros} />
        <Link
          to={rutas.registroRapido}
          aria-label="Registro rápido"
          className="-mt-[22px] box-border flex size-[54px] items-center justify-center justify-self-center rounded-[18px] bg-brasa text-white shadow-[0_8px_16px_-6px_rgb(0_0_0/0.7)] hover:bg-brasa-hover"
        >
          <Icon nombre="mas" tamano={24} grosor={2.4} />
        </Link>
        <Pestana {...asistente} />
        <Pestana {...progreso} />
      </div>
    </nav>
  )
}
