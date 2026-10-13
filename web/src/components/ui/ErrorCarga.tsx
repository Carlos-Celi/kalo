import { Button } from './Button'

interface Props {
  mensaje: string
  className?: string
}

/** Fallo al cargar una pantalla: dice qué pasó y deja reintentar sin buscar el botón del navegador. */
export function ErrorCarga({ mensaje, className = '' }: Props) {
  return (
    <div role="alert" className={`flex flex-col items-center gap-3 py-10 text-center ${className}`}>
      <p className="text-sm font-semibold text-error">{mensaje}</p>
      <Button variante="suave" onClick={() => window.location.reload()}>
        Reintentar
      </Button>
    </div>
  )
}
