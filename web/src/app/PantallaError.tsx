import { Button } from '../components/ui/Button'
import { MascotAvatar } from '../components/ui/MascotAvatar'
import { rutas } from './rutas'

/**
 * Se muestra si una pantalla falla al pintarse o al cargar su código, en
 * lugar de dejar la página en blanco. No enseña el detalle del error.
 */
export function PantallaError() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      <MascotAvatar tamano={72} />
      <h1 className="text-2xl font-extrabold tracking-[-0.5px]">Algo salió mal</h1>
      <p role="alert" className="max-w-xs text-sm font-medium text-tinta-3">
        No pudimos mostrar esta pantalla. Tus datos guardados no se ven afectados.
      </p>
      <div className="flex flex-col gap-2.5">
        <Button tamano="lg" onClick={() => window.location.reload()}>
          Recargar
        </Button>
        {/* Enlace normal, no del router: vuelve a cargar la app desde cero. */}
        <a href={rutas.inicio} className="flex min-h-11 items-center justify-center text-sm font-bold">
          Volver a Inicio
        </a>
      </div>
    </main>
  )
}
