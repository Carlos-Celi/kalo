import type { ReactNode } from 'react'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { MascotAvatar } from '../../components/ui/MascotAvatar'

interface Props {
  /** Frase bajo el logotipo. */
  lema: string
  children: ReactNode
}

const promesas: { icono: NombreIcono; texto: string }[] = [
  { icono: 'camara', texto: 'Registra tu comida con una foto' },
  { icono: 'chat', texto: 'Un asistente que lee tus datos y te guía' },
  { icono: 'barras', texto: 'Calorías, proteína, agua, ejercicio y sueño en un solo lugar' },
]

/** Resplandor de sala detrás de Kalo: la llama es la fuente de luz. */
function Luz({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -z-10 aspect-square rounded-full bg-[radial-gradient(closest-side,rgb(249_115_22/0.45),transparent)] ${className}`}
    />
  )
}

/**
 * Marco de las pantallas sin sesión: Kalo encendido sobre la sala oscura, lema
 * y el formulario. Desde 768 px se reparte en horizontal: panel de marca a la
 * izquierda y formulario a la derecha.
 */
export function MarcoAcceso({ lema, children }: Props) {
  return (
    <div className="min-h-dvh bg-sala md:grid md:grid-cols-2">
      <aside
        aria-hidden="true"
        className="relative isolate hidden flex-col justify-between overflow-hidden bg-muro p-12 md:flex"
      >
        <Luz className="top-[18%] left-1/2 w-[120%] -translate-x-1/2" />
        <span className="num-marcador text-[34px] leading-none font-extrabold uppercase">kalo</span>

        <div className="flex flex-col items-center gap-6">
          <MascotAvatar tamano={240} estado="encendido" />
          <p className="num-marcador max-w-[420px] text-center text-[44px] leading-[0.95] font-extrabold uppercase">
            Come mejor, muévete más y duerme bien.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {promesas.map(({ icono, texto }) => (
            <li key={texto} className="flex items-center gap-3 text-[15px] font-semibold text-ceniza">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sala text-llama">
                <Icon nombre={icono} tamano={20} />
              </span>
              {texto}
            </li>
          ))}
        </ul>
      </aside>

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-[22px] bg-sala px-5 pt-[max(40px,env(safe-area-inset-top))] pb-8 md:max-w-[520px] md:px-12">
        <div className="relative isolate flex flex-col items-center gap-1 md:hidden">
          <Luz className="top-0 left-1/2 w-[420px] -translate-x-1/2" />
          <MascotAvatar
            tamano={150}
            estado="encendido"
            alt="Kalo, la mascota llama con lentes de sol"
          />
          <div className="num-marcador text-[64px] leading-[0.9] font-extrabold uppercase">kalo</div>
          <p className="text-center text-sm text-ceniza">{lema}</p>
        </div>
        <p className="hidden text-sm text-ceniza md:block">{lema}</p>
        {children}
      </main>
    </div>
  )
}
