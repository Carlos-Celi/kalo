import type { ReactNode } from 'react'
import { Icon } from './Icon'

type Tono = 'error' | 'aviso'

const tonos: Record<Tono, { caja: string; icono: string }> = {
  error: { caja: 'border-exceso/40 bg-exceso/10', icono: 'text-exceso' },
  aviso: { caja: 'border-peso-luz/40 bg-peso-luz/10', icono: 'text-peso-luz' },
}

interface Props {
  /** Qué pasó, en pocas palabras: «No pudimos guardar la comida». */
  titulo: string
  /** Por qué pudo pasar y qué hacer; si los datos están a salvo, se dice. */
  children?: ReactNode
  tono?: Tono
  /** Acción para resolverlo sin buscarla: «Reintentar», «Registrar a mano»… */
  accion?: { texto: string; onClick: () => void }
  className?: string
}

/**
 * Mensaje de error o aviso de toda la app (docs/rediseno/guia.md §7): icono,
 * título que nombra el problema, detalle con la salida y una acción opcional.
 * Nunca muestra el texto interno del servidor ni del proveedor.
 */
export function Alerta({ titulo, children, tono = 'error', accion, className = '' }: Props) {
  const estilo = tonos[tono]
  return (
    <div
      role={tono === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-boton-sm border px-3.5 py-3 ${estilo.caja} ${className}`}
    >
      <Icon nombre="alerta" tamano={20} className={`mt-px shrink-0 ${estilo.icono}`} />
      <div className="flex min-w-0 grow flex-col gap-1">
        <p className="text-sm leading-snug font-semibold text-hueso">{titulo}</p>
        {children && <div className="text-[13px] leading-normal text-ceniza">{children}</div>}
        {accion && (
          <button
            type="button"
            onClick={accion.onClick}
            className="-mb-1 mt-1 flex min-h-11 items-center self-start rounded-boton-sm border border-filo px-3.5 text-[13px] font-bold text-hueso hover:bg-muro"
          >
            {accion.texto}
          </button>
        )}
      </div>
    </div>
  )
}
