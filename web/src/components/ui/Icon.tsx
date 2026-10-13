import type { ReactNode } from 'react'

// Trazos tomados de los SVG del diseño (viewBox 24×24).
const trazos = {
  casa: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  portapapeles: <path d="M9 4h6v3H9zM7 5.5H5.5v15h13v-15H17M9 12h6M9 16h4" />,
  mas: <path d="M12 5v14M5 12h14" />,
  chat: <path d="M4 5h16v11H10l-6 4z" />,
  barras: <path d="M6 20v-6M12 20V8M18 20v-10" />,
  campana: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  ajustes: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  gota: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  llama: <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 2 3 4 1-2 1-5 0-8z" />,
  luna: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  cubiertos: <path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 1-3 4-3 7h3v11" />,
} satisfies Record<string, ReactNode>

export type NombreIcono = keyof typeof trazos

interface Props {
  nombre: NombreIcono
  tamano?: number
  grosor?: number
  className?: string
}

/** Icono decorativo: el texto accesible lo pone quien lo usa. */
export function Icon({ nombre, tamano = 22, grosor = 1.8, className }: Props) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {trazos[nombre]}
    </svg>
  )
}
