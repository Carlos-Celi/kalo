/** Bloque gris palpitante que ocupa el sitio de lo que está cargando. */
export function Esqueleto({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-tarjeta bg-arena ${className}`} />
}
