import mascota from '../../assets/kalo.png'

export type EstadoMascota = 'encendido' | 'medias' | 'apagado'

const filtros: Record<EstadoMascota, string> = {
  encendido: 'drop-shadow(0 0 20px rgb(249 115 22 / 0.75))',
  medias: 'saturate(0.7) brightness(0.85)',
  apagado: 'grayscale(1) brightness(0.6)',
}

interface Props {
  tamano?: number
  /** Texto alternativo; vacío si la mascota es decorativa. */
  alt?: string
  /** Brillo de 0 a 1: la llama es la fuente de luz de la sala (docs/rediseno/guia.md §5). */
  brillo?: number
  /** Pose por estado: encendido (meta cumplida), a medias o apagado (sin registro). */
  estado?: EstadoMascota
  className?: string
}

/** Llama de Kalo sin fondo (assets/Kalo.png), sobre la sala oscura. */
export function MascotAvatar({ tamano = 44, alt = '', brillo, estado, className = '' }: Props) {
  let filtro: string | undefined
  if (estado) filtro = filtros[estado]
  else if (brillo !== undefined) {
    const b = Math.min(Math.max(brillo, 0), 1)
    filtro = `drop-shadow(0 ${Math.round(6 * b)}px ${Math.round(4 + b * 18)}px rgb(249 115 22 / ${(0.2 + b * 0.5).toFixed(2)}))`
  }
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: tamano, height: tamano }}>
      <img
        src={mascota}
        alt={alt}
        width={256}
        height={256}
        className="size-full object-contain transition-[filter] duration-[900ms] ease-(--ease-sala)"
        style={filtro ? { filter: filtro } : undefined}
      />
    </div>
  )
}
