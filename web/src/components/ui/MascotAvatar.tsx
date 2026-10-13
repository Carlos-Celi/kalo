import mascota from '../../assets/kalo-mascot.png'

// El PNG es un ícono cuadrado con márgenes blancos: se amplía y se desplaza
// para que el círculo recorte solo la llama (proporciones del diseño:
// imagen de 79 px en un círculo de 44 px, desplazada -17/-16 px).
const ESCALA = 79 / 44
const DESPLAZAMIENTO_X = -17 / 44
const DESPLAZAMIENTO_Y = -16 / 44

interface Props {
  tamano?: number
  /** Texto alternativo; vacío si la mascota es decorativa. */
  alt?: string
  className?: string
}

export function MascotAvatar({ tamano = 44, alt = '', className = '' }: Props) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-mascota ${className}`}
      style={{ width: tamano, height: tamano }}
    >
      <img
        src={mascota}
        alt={alt}
        width={320}
        height={320}
        className="absolute max-w-none"
        style={{
          width: tamano * ESCALA,
          height: tamano * ESCALA,
          left: tamano * DESPLAZAMIENTO_X,
          top: tamano * DESPLAZAMIENTO_Y,
        }}
      />
    </div>
  )
}
