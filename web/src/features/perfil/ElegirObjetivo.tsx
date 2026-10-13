import { Icon } from '../../components/ui/Icon'
import type { Objetivo } from '../../domain/perfil'
import { opcionesObjetivo } from './opciones'

interface Props {
  valor: Objetivo | null
  onElegir: (objetivo: Objetivo) => void
  error?: string | null
}

/** Las cuatro tarjetas de objetivo principal, a una columna en móvil y en rejilla en escritorio. */
export function ElegirObjetivo({ valor, onElegir, error }: Props) {
  return (
    <fieldset
      aria-describedby={error ? 'objetivo-error' : undefined}
      className="grid gap-2.5 sm:grid-cols-2"
    >
      <legend className="sr-only">Objetivo principal</legend>
      {opcionesObjetivo.map(({ valor: opcion, icono, titulo, detalle }) => {
        const elegido = valor === opcion
        return (
          <label
            key={opcion}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-llama ${
              elegido ? 'border-[1.5px] border-llama bg-crema' : 'border border-borde bg-white hover:bg-crema-suave'
            }`}
          >
            <input
              type="radio"
              name="objetivo"
              value={opcion}
              checked={elegido}
              onChange={() => onElegir(opcion)}
              className="sr-only"
            />
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-boton-sm ${
                elegido ? 'bg-kalo text-white' : 'bg-crema text-kalo'
              }`}
            >
              <Icon nombre={icono} tamano={20} />
            </span>
            <span className="flex grow flex-col gap-0.5">
              <span className="text-[15px] font-bold">{titulo}</span>
              <span className="text-xs font-medium text-tinta-3">{detalle}</span>
            </span>
            <span
              aria-hidden="true"
              className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${
                elegido ? 'bg-kalo text-white' : 'border-[1.5px] border-borde-fuerte bg-white'
              }`}
            >
              {elegido && <Icon nombre="check" tamano={14} grosor={3} />}
            </span>
          </label>
        )
      })}
      {error && (
        <p id="objetivo-error" className="text-xs font-semibold text-error sm:col-span-2">
          {error}
        </p>
      )}
    </fieldset>
  )
}
