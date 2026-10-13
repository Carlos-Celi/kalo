import type { ReactNode } from 'react'

type Tono = 'ia' | 'media'

const tonos: Record<Tono, string> = {
  ia: 'bg-ia-fondo text-kalo-oscuro',
  media: 'bg-media-fondo text-peso-texto',
}

interface Props {
  tono?: Tono
  children: ReactNode
}

/** Insignia informativa ("IA", "Licor", "Media"). */
export function Badge({ tono = 'ia', children }: Props) {
  return (
    <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${tonos[tono]}`}>
      {children}
    </span>
  )
}
