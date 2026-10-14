interface Props {
  /** Nombre accesible: qué activa o desactiva. */
  etiqueta: string
  activo: boolean
  onCambio: () => void
}

/** Interruptor del diseño (50×30 px) dentro de un objetivo táctil de 44 px. */
export function Interruptor({ etiqueta, activo, onCambio }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onCambio}
      className="flex h-11 w-[50px] shrink-0 items-center"
    >
      <span
        className={`flex h-[30px] w-[50px] rounded-full p-[3px] ${
          activo ? 'justify-end bg-brasa' : 'justify-start bg-filo'
        }`}
      >
        <span className="size-6 rounded-full bg-muro" />
      </span>
    </button>
  )
}
