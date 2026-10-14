import { Alerta } from './Alerta'

interface Props {
  /** Qué no se pudo cargar: «No pudimos cargar tus registros». */
  mensaje: string
  className?: string
}

/** Fallo al cargar una pantalla: dice qué pasó, que los datos están a salvo y deja reintentar. */
export function ErrorCarga({ mensaje, className = '' }: Props) {
  return (
    <Alerta
      titulo={mensaje}
      accion={{ texto: 'Reintentar', onClick: () => window.location.reload() }}
      className={`my-6 ${className}`}
    >
      Suele ser la conexión. Tus datos guardados no se pierden: comprueba que tienes internet y vuelve
      a intentarlo.
    </Alerta>
  )
}
