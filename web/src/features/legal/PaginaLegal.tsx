import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Icon } from '../../components/ui/Icon'

/** Fecha de la versión vigente de la política y los términos. Se guarda al aceptar. */
export const VERSION_POLITICAS = '2026-10-13'

interface Props {
  titulo: string
  children: ReactNode
}

/** Marco de lectura de las páginas legales: abiertas con o sin sesión. */
export function PaginaLegal({ titulo, children }: Props) {
  useTitulo(titulo)
  return (
    <div className="min-h-dvh bg-sala">
      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-5 pt-[max(24px,env(safe-area-inset-top))] pb-16">
        <Link
          to={rutas.inicio}
          className="flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-ceniza no-underline hover:text-hueso"
        >
          <Icon nombre="flechaAtras" tamano={18} />
          Volver a Kalo
        </Link>
        <header className="flex flex-col gap-2">
          <h1 className="num-marcador text-[44px] leading-[0.92] font-extrabold uppercase">{titulo}</h1>
          <p className="text-sm text-ceniza">Versión vigente desde el {VERSION_POLITICAS.split('-').reverse().join('/')}.</p>
        </header>
        <div className="flex flex-col gap-7 text-[15px] leading-relaxed text-hueso [&_a]:font-semibold [&_a]:text-llama [&_h2]:num-marcador [&_h2]:text-[24px] [&_h2]:leading-none [&_h2]:font-bold [&_h2]:uppercase [&_li]:ml-5 [&_li]:list-disc [&_p]:max-w-[68ch] [&_section]:flex [&_section]:flex-col [&_section]:gap-2.5 [&_strong]:font-semibold [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
        <nav aria-label="Documentos legales" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-divisor pt-5 text-sm">
          <Link to={rutas.privacidad} className="flex min-h-11 items-center font-semibold text-llama">
            Política de privacidad
          </Link>
          <Link to={rutas.terminos} className="flex min-h-11 items-center font-semibold text-llama">
            Términos de uso
          </Link>
          <Link to={rutas.cookies} className="flex min-h-11 items-center font-semibold text-llama">
            Cookies y almacenamiento
          </Link>
        </nav>
      </main>
    </div>
  )
}
