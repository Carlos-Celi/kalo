import type { ReactNode } from 'react'
import mascota from '../../assets/kalo-mascot.png'

interface Props {
  /** Frase bajo el logotipo. */
  lema: string
  children: ReactNode
}

/** Marco de las pantallas sin sesión: logotipo, lema y el formulario. */
export function MarcoAcceso({ lema, children }: Props) {
  return (
    <div className="min-h-dvh lg:flex lg:items-center lg:justify-center lg:bg-crema-suave lg:p-10">
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-[22px] bg-white px-5 pt-[max(40px,env(safe-area-inset-top))] pb-8 lg:min-h-0 lg:max-w-[440px] lg:rounded-[28px] lg:border lg:border-borde lg:p-10">
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative size-[124px] overflow-hidden rounded-[28px] shadow-[0_12px_28px_rgba(209,61,10,0.28)]">
            <img
              src={mascota}
              alt="Kalo, la mascota llama con lentes de sol"
              width={320}
              height={320}
              className="absolute -top-[5px] -left-[5px] size-[134px] max-w-none"
            />
          </div>
          <div className="text-[38px] leading-none font-extrabold tracking-[-1.5px] text-kalo">
            kalo
          </div>
          <p className="text-center text-sm text-tinta-3">{lema}</p>
        </div>
        {children}
      </main>
    </div>
  )
}
