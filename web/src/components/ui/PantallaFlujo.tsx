import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { MascotAvatar } from './MascotAvatar'
import { Icon } from './Icon'

interface Props {
  titulo: string
  /** Ruta a la que vuelve la flecha. Sin ella no hay flecha. */
  volver?: string
  /** "centrado": título pequeño al centro (Manual). "destacado": título grande a la izquierda (Peso). */
  variante?: 'centrado' | 'destacado'
  /** Más ancho en escritorio, para formularios con varias columnas. */
  ancha?: boolean
  children: ReactNode
}

/**
 * Marco de las pantallas de un solo propósito, sin tab bar: flecha de
 * volver, título y contenido. En móvil ocupa la pantalla; desde tablet se
 * muestra como una tarjeta centrada y más ancha, para que los formularios
 * se repartan en horizontal.
 */
export function PantallaFlujo({ titulo, volver, variante = 'centrado', ancha = false, children }: Props) {
  const destacado = variante === 'destacado'
  return (
    <div className="min-h-dvh bg-muro sm:flex sm:items-center sm:justify-center sm:bg-muro sm:p-8 lg:p-10">
      <main
        className={`mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-muro px-4 pt-[max(20px,env(safe-area-inset-top))] pb-7 sm:min-h-[640px] sm:rounded-[28px] sm:border sm:border-filo sm:p-8 ${
          ancha ? 'sm:max-w-[820px] lg:max-w-[1000px]' : 'sm:max-w-[720px]'
        }`}
      >
        <div className={`flex items-center ${destacado ? 'gap-2' : 'gap-3.5'}`}>
          {volver ? (
            <Link
              to={volver}
              aria-label="Volver"
              className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                destacado ? 'bg-banco text-llama' : 'bg-banco text-hueso hover:bg-filo'
              }`}
            >
              <Icon nombre="flechaAtras" tamano={20} grosor={2} />
            </Link>
          ) : (
            <MascotAvatar tamano={44} />
          )}
          <h1
            className={
              destacado
                ? 'text-[22px] font-extrabold tracking-[-0.4px]'
                : volver
                  ? 'grow pr-[58px] text-center text-base font-bold'
                  : 'grow text-lg font-extrabold'
            }
          >
            {titulo}
          </h1>
        </div>
        {children}
      </main>
    </div>
  )
}
