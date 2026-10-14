import type { ReactNode } from 'react'

type Tono = 'ia' | 'media'

const tonos: Record<Tono, string> = {
  ia: 'bg-llama/15 text-llama',
  media: 'bg-peso-luz/15 text-peso-luz',
}

interface Props {
  tono?: Tono
  children: ReactNode
}

/** Insignia informativa ("IA", "Licor", "Media"). */
export function Badge({ tono = 'ia', children }: Props) {
  return (
    <span
      className={`inline-block rounded-[5px] px-1.5 py-1 text-[11px] leading-none font-bold tracking-[0.06em] uppercase ${tonos[tono]}`}
    >
      {children}
    </span>
  )
}
