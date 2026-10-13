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
  sobre: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  candado: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  ojo: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  ojoTachado: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4l16 16" />
    </>
  ),
  escudo: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  salir: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9" />,
  flechaAtras: <path d="M15 5l-7 7 7 7" />,
  persona: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </>
  ),
  calendario: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  pulso: <path d="M3 12h4l3-7 4 14 3-7h4" />,
  pesa: <path d="M6 6l12 12M4 8l4-4M16 20l4-4M3 11l8-8M13 21l8-8" />,
  hoja: (
    <>
      <path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" />
      <path d="M5 19l8-8" />
    </>
  ),
  diana: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  destello: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
  check: <path d="M5 12l5 5 9-10" />,
  mancuerna: <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />,
  camara: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  flechaAdelante: <path d="M9 6l6 6-6 6" />,
  bascula: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M8.5 10a4.5 4.5 0 0 1 7 0M12 9.5l1.5-2" />
    </>
  ),
  copa: (
    <>
      <path d="M7 3h10l-1 8a4 4 0 0 1-8 0z" />
      <path d="M12 15v6M8 21h8" />
    </>
  ),
  rayo: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  lapiz: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  imagen: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  llave: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9M16 7l3 3" />
    </>
  ),
  enviar: <path d="M5 12h14M13 6l6 6-6 6" />,
  papelera: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  muslo: (
    <>
      <path d="M14.5 4.5a4.5 4.5 0 1 1 5 5l-6.2 6.2a2.6 2.6 0 1 1-3.7-3.7z" />
      <path d="M10 14l-3.5 3.5" />
    </>
  ),
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
