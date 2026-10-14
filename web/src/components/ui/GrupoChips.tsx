import { Chip } from './Chip'

interface Props<T> {
  pregunta: string
  opciones: { valor: T; etiqueta: string }[]
  elegidas: readonly T[]
  onElegir: (valor: T) => void
  /** Muestra el aviso de que falta elegir una opción. */
  falta?: boolean
}

/** Pregunta con respuestas en píldoras: una o varias elegidas. */
export function GrupoChips<T extends string>({ pregunta, opciones, elegidas, onElegir, falta }: Props<T>) {
  return (
    <div role="group" aria-label={pregunta} className="flex flex-col gap-2.5">
      <div className="text-sm font-bold">{pregunta}</div>
      <div className="flex flex-wrap gap-2">
        {opciones.map(({ valor, etiqueta }) => (
          <Chip
            key={valor}
            tono="crema"
            seleccionado={elegidas.includes(valor)}
            onClick={() => onElegir(valor)}
          >
            {etiqueta}
          </Chip>
        ))}
      </div>
      {falta && <p className="text-xs font-semibold text-exceso">Elige una opción.</p>}
    </div>
  )
}
