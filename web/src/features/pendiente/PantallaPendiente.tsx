import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { MascotAvatar } from '../../components/ui/MascotAvatar'

interface Props {
  titulo: string
  /** Archivo de `design/` que servirá de referencia al implementarla. */
  referencia?: string
}

/** Marcador de una pantalla que aún no se ha implementado. */
export function PantallaPendiente({ titulo, referencia }: Props) {
  useTitulo(titulo)
  return (
    <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <MascotAvatar tamano={72} />
      <h1 className="text-2xl font-extrabold tracking-[-0.5px]">{titulo}</h1>
      <p className="max-w-xs text-sm font-medium text-tinta-3">
        Esta pantalla todavía está en construcción.
        {referencia && (
          <>
            {' '}
            Referencia: <code className="text-tinta-2">design/{referencia}</code>
          </>
        )}
      </p>
      <Button to={rutas.inicio}>Volver a Inicio</Button>
    </section>
  )
}
