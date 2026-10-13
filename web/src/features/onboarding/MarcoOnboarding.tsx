import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/ui/Icon'

const TOTAL_PASOS = 4

const claseVolver =
  'flex size-11 shrink-0 items-center justify-center rounded-full bg-arena text-tinta hover:bg-borde'

interface Props {
  /** Paso actual (1 a 4). Sin él, la cabecera muestra `encabezado` centrado. */
  paso?: number
  encabezado?: string
  /** Ruta anterior, o una acción (p. ej. cerrar sesión en el primer paso). */
  volver: string | { etiqueta: string; accion: () => void }
  titulo?: string
  lema?: string
  onEnviar: () => void
  /** Botón principal, al pie. */
  pie: ReactNode
  children: ReactNode
}

/** Marco de los pasos del onboarding: cabecera con progreso, contenido y botón al pie. */
export function MarcoOnboarding({
  paso,
  encabezado,
  volver,
  titulo,
  lema,
  onEnviar,
  pie,
  children,
}: Props) {
  function enviar(evento: FormEvent) {
    evento.preventDefault()
    onEnviar()
  }

  return (
    <div className="min-h-dvh bg-white sm:flex sm:items-center sm:justify-center sm:bg-crema-suave sm:p-8 lg:p-10">
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-5 bg-white px-5 pt-[max(20px,env(safe-area-inset-top))] pb-8 sm:min-h-[640px] sm:max-w-[780px] sm:rounded-[28px] sm:border sm:border-borde sm:p-10 sm:shadow-[0_12px_40px_-16px_rgba(120,60,30,0.25)]">
        <div className="flex items-center gap-3.5">
          {typeof volver === 'string' ? (
            <Link to={volver} aria-label="Volver" className={claseVolver}>
              <Icon nombre="flechaAtras" tamano={20} grosor={2} />
            </Link>
          ) : (
            <button
              type="button"
              aria-label={volver.etiqueta}
              onClick={volver.accion}
              className={claseVolver}
            >
              <Icon nombre="flechaAtras" tamano={20} grosor={2} />
            </button>
          )}
          {paso ? (
            <>
              <div
                role="progressbar"
                aria-label="Progreso del registro"
                aria-valuemin={1}
                aria-valuemax={TOTAL_PASOS}
                aria-valuenow={paso}
                aria-valuetext={`Paso ${paso} de ${TOTAL_PASOS}`}
                className="grid grow grid-cols-4 gap-1.5"
              >
                {Array.from({ length: TOTAL_PASOS }, (_, i) => (
                  <div
                    key={i}
                    className={`h-[5px] rounded-[3px] ${i < paso ? 'bg-kalo' : 'bg-borde'}`}
                  />
                ))}
              </div>
              <div aria-hidden="true" className="text-xs font-semibold text-tinta-3">
                {paso}/{TOTAL_PASOS}
              </div>
            </>
          ) : (
            <h1 className="grow pr-[58px] text-center text-base font-bold">{encabezado}</h1>
          )}
        </div>

        {titulo && (
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[27px] leading-tight font-extrabold tracking-[-0.6px]">{titulo}</h1>
            {lema && <p className="text-sm leading-normal text-tinta-3">{lema}</p>}
          </div>
        )}

        <form noValidate onSubmit={enviar} className="flex grow flex-col gap-5">
          {children}
          <div className="mt-auto flex flex-col gap-3 pt-2 sm:ml-auto sm:w-full sm:max-w-[340px]">{pie}</div>
        </form>
      </main>
    </div>
  )
}

/** Aviso en crema con icono, como los del diseño. */
export function Nota({ icono, children }: { icono: 'escudo' | 'pulso'; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 rounded-boton bg-crema p-3.5 text-xs leading-normal font-semibold text-kalo-oscuro">
      <Icon nombre={icono} tamano={18} className="shrink-0" />
      <span>{children}</span>
    </div>
  )
}
