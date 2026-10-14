import { rutas } from './rutas'
import { useTitulo } from './useTitulo'
import { Button } from '../components/ui/Button'
import { MascotAvatar } from '../components/ui/MascotAvatar'

/** Respuesta a cualquier ruta que no existe. */
export function PaginaNoEncontrada() {
  useTitulo('Página no encontrada')
  return (
    <section className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <MascotAvatar tamano={96} estado="apagado" />
      <h1 className="num-marcador text-[40px] leading-[0.9] font-extrabold uppercase">
        Página no encontrada
      </h1>
      <p className="max-w-xs text-sm font-medium text-ceniza">
        Esta dirección no existe o cambió. Tus registros siguen en su sitio.
      </p>
      <Button to={rutas.inicio}>Volver a Inicio</Button>
    </section>
  )
}
