import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'

type Variante = 'primario' | 'secundario' | 'suave'
type Tamano = 'md' | 'lg' | 'xl'

const base =
  'inline-flex items-center justify-center px-4 font-bold no-underline disabled:opacity-50'

const variantes: Record<Variante, string> = {
  primario: 'bg-kalo text-white hover:bg-kalo-oscuro',
  secundario: 'bg-white text-kalo-oscuro hover:bg-crema-suave',
  suave: 'bg-crema text-kalo-oscuro hover:bg-kalo-claro',
}

const tamanos: Record<Tamano, string> = {
  md: 'h-[46px] rounded-boton-sm text-sm',
  lg: 'h-[50px] rounded-boton text-[15px]',
  xl: 'h-[54px] rounded-boton text-base',
}

interface Comunes {
  variante?: Variante
  tamano?: Tamano
  className?: string
  children: ReactNode
}

type Props =
  | (Comunes & { to: string })
  | (Comunes & { to?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>)

/** Botón de la marca. Con `to` se renderiza como enlace de navegación. */
export function Button({
  variante = 'primario',
  tamano = 'md',
  className = '',
  children,
  ...resto
}: Props) {
  const clases = `${base} ${variantes[variante]} ${tamanos[tamano]} ${className}`
  if (resto.to !== undefined) {
    return (
      <Link to={resto.to} className={clases}>
        {children}
      </Link>
    )
  }
  const { to: _to, type = 'button', ...atributos } = resto
  return (
    <button type={type} className={clases} {...atributos}>
      {children}
    </button>
  )
}
