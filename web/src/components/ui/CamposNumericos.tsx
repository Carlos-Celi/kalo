import { useState, type ReactNode } from 'react'
import { numeroDeTexto } from '../../domain/formato'
import { Icon } from './Icon'

const claseCaja =
  'flex h-[52px] items-center rounded-boton border bg-muro text-ceniza focus-within:border-[1.5px] focus-within:border-llama focus-within:bg-muro'

/** "1850" · "2,25": el número tal como se escribe en español, con coma decimal. */
function aTexto(valor: number, decimales: number): string {
  return String(Number(valor.toFixed(decimales))).replace('.', ',')
}

interface PropsNumero {
  id: string
  etiqueta: string
  unidad: string
  valor: number
  min: number
  max: number
  /** Cuánto suman o restan los botones. */
  paso: number
  decimales?: number
  onCambio: (valor: number) => void
  ayuda?: ReactNode
}

const claseBotonPaso =
  'flex size-12 shrink-0 items-center justify-center rounded-boton-sm border border-filo bg-banco text-[22px] font-bold text-hueso hover:bg-filo disabled:opacity-40'

/**
 * Número editable con botones − y +: se puede escribir o ajustar por pasos.
 * Lo escrito solo llega a `onCambio` cuando está dentro del rango; al salir
 * del campo se corrige al valor válido.
 */
export function CampoNumero({
  id,
  etiqueta,
  unidad,
  valor,
  min,
  max,
  paso,
  decimales = 0,
  onCambio,
  ayuda,
}: PropsNumero) {
  // Mientras se escribe se muestra lo tecleado; si no, siempre el valor.
  const [tecleado, setEscrito] = useState<string | null>(null)
  const texto = tecleado ?? aTexto(valor, decimales)

  const escrito = numeroDeTexto(texto)
  const fuera = texto !== '' && (!Number.isFinite(escrito) || escrito < min || escrito > max)
  const idAyuda = `${id}-ayuda`

  function mover(sentido: 1 | -1) {
    const nuevo = Math.round((valor + sentido * paso) * 100) / 100
    onCambio(Math.min(Math.max(nuevo, min), max))
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-bold">
        {etiqueta}
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Disminuir ${etiqueta.toLowerCase()}`}
          disabled={valor <= min}
          onClick={() => mover(-1)}
          className={claseBotonPaso}
        >
          −
        </button>
        <div
          className={`${claseCaja} min-w-0 grow justify-center gap-1.5 px-2 ${fuera ? 'border-exceso' : 'border-filo'}`}
        >
          <input
            id={id}
            type="text"
            inputMode={decimales > 0 ? 'decimal' : 'numeric'}
            autoComplete="off"
            value={texto}
            aria-invalid={fuera ? true : undefined}
            aria-describedby={idAyuda}
            onFocus={() => setEscrito(aTexto(valor, decimales))}
            onBlur={() => setEscrito(null)}
            onChange={(evento) => {
              const nuevo = evento.target.value.replace(/[^\d.,]/g, '')
              setEscrito(nuevo)
              const numero = numeroDeTexto(nuevo)
              if (Number.isFinite(numero) && numero >= min && numero <= max) onCambio(numero)
            }}
            className="num-marcador w-full min-w-0 border-0 bg-transparent text-center text-[26px] font-bold text-hueso outline-none"
          />
          <span className="shrink-0 text-sm font-semibold text-ceniza">{unidad}</span>
        </div>
        <button
          type="button"
          aria-label={`Aumentar ${etiqueta.toLowerCase()}`}
          disabled={valor >= max}
          onClick={() => mover(1)}
          className={claseBotonPaso}
        >
          +
        </button>
      </div>
      <p
        id={idAyuda}
        className={`text-xs leading-normal font-medium ${fuera ? 'font-semibold text-exceso' : 'text-ceniza'}`}
      >
        {fuera ? `Escribe un valor entre ${aTexto(min, decimales)} y ${aTexto(max, decimales)} ${unidad}.` : ayuda}
      </p>
    </div>
  )
}

interface PropsMedida {
  id: string
  etiqueta: string
  unidad: string
  /** El texto tal como se escribe; vacío si aún no hay valor. */
  valor: string
  onCambio: (valor: string) => void
  placeholder?: string
  ayuda?: ReactNode
  /** Con decimales admite coma o punto. */
  decimales?: boolean
  maxLength?: number
}

/** Campo numérico corto, sin botones, para formularios en fila (horas, minutos, calorías). */
export function CampoMedida({
  id,
  etiqueta,
  unidad,
  valor,
  onCambio,
  placeholder,
  ayuda,
  decimales = false,
  maxLength = 5,
}: PropsMedida) {
  const idAyuda = `${id}-ayuda`
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-bold">
        {etiqueta}
      </label>
      <div className={`${claseCaja} gap-2 border-filo px-3.5`}>
        <input
          id={id}
          type="text"
          inputMode={decimales ? 'decimal' : 'numeric'}
          autoComplete="off"
          maxLength={maxLength}
          placeholder={placeholder}
          value={valor}
          aria-describedby={ayuda ? idAyuda : undefined}
          onChange={(evento) =>
            onCambio(evento.target.value.replace(decimales ? /[^\d.,]/g : /\D/g, ''))
          }
          className="w-full min-w-0 border-0 bg-transparent text-[17px] font-bold text-hueso outline-none"
        />
        <span className="shrink-0 text-[13px] font-semibold">{unidad}</span>
      </div>
      {ayuda && (
        <p id={idAyuda} className="text-xs leading-normal font-medium text-ceniza">
          {ayuda}
        </p>
      )}
    </div>
  )
}

/** Resultado de guardar: aviso breve de confirmación que no ocupa sitio si no hay nada que decir. */
export function AvisoGuardado({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="flex animate-aparecer items-center gap-2 rounded-boton bg-banco px-3.5 py-3 text-[13px] font-bold text-llama"
    >
      <Icon nombre="check" tamano={16} grosor={2.4} className="shrink-0" />
      {children}
    </p>
  )
}
