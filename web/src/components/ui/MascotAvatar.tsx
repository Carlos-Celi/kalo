import mascota from '../../assets/kalo.png'

interface Props {
  tamano?: number
  /** Texto alternativo; vacío si la mascota es decorativa. */
  alt?: string
  className?: string
}

/** Llama de Kalo sin fondo, centrada en un círculo cálido (assets/Kalo.png). */
export function MascotAvatar({ tamano = 44, alt = '', className = '' }: Props) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-linear-to-b from-kalo-claro to-barra-suave ${className}`}
      style={{ width: tamano, height: tamano }}
    >
      <img src={mascota} alt={alt} width={256} height={256} className="size-full object-contain" />
    </div>
  )
}
