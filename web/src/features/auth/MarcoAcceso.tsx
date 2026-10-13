import type { ReactNode } from 'react'
import icono from '../../assets/kalo-icono.png'
import { Icon, type NombreIcono } from '../../components/ui/Icon'

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

/**
 * Marco de las pantallas sin sesión: logotipo, lema y el formulario. Desde
 * 768 px se reparte en horizontal: panel de marca a la izquierda y formulario
 * a la derecha.
 */
export function MarcoAcceso({ lema, children }: Props) {
  return (
    <div className="min-h-dvh bg-white md:grid md:grid-cols-2">
      <aside
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-kalo to-brasa p-12 text-white md:flex"
      >
        <div className="flex items-center gap-3">
          <img src={icono} alt="" width={256} height={256} className="size-14 rounded-2xl" />
          <span className="text-[34px] leading-none font-extrabold tracking-[-1.5px]">kalo</span>
        </div>

        <div className="flex flex-col gap-6">
          <p className="max-w-[420px] text-[34px] leading-[1.1] font-extrabold tracking-[-1px]">
            Come mejor, muévete más y duerme bien.
          </p>
          <ul className="flex flex-col gap-3.5">
            {promesas.map(({ icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-[15px] font-semibold">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon nombre={icono} tamano={20} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <span className="text-xs font-semibold">Nutrición y hábitos con IA</span>
        <span className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full bg-white/10" />
      </aside>

      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-[22px] bg-white px-5 pt-[max(40px,env(safe-area-inset-top))] pb-8 md:max-w-[520px] md:px-12">
        <div className="flex flex-col items-center gap-2.5 md:hidden">
          <img
            src={icono}
            alt="Kalo, la mascota llama con lentes de sol"
            width={256}
            height={256}
            className="size-[124px] rounded-[28px] shadow-[0_12px_28px_rgba(209,61,10,0.28)]"
          />
          <div className="text-[38px] leading-none font-extrabold tracking-[-1.5px] text-kalo">
            kalo
          </div>
          <p className="text-center text-sm text-tinta-3">{lema}</p>
        </div>
        <p className="hidden text-sm text-tinta-3 md:block">{lema}</p>
        {children}
      </main>
    </div>
  )
}
