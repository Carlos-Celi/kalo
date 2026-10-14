import { useState, type InputHTMLAttributes } from 'react'
import { Icon, type NombreIcono } from './Icon'

interface Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value' | 'className'> {
  id: string
  etiqueta: string
  icono: NombreIcono
  valor: string
  onCambio: (valor: string) => void
  error?: string | null
  /** Unidad que se muestra a la derecha (p. ej. "kg"). */
  sufijo?: string
}

/**
 * Campo de formulario del diseño (Login): etiqueta, icono y borde que se
 * enciende con el foco. Con `type="password"` añade el botón de mostrar.
 */
export function CampoTexto({
  id,
  etiqueta,
  icono,
  valor,
  onCambio,
  error,
  sufijo,
  type,
  ...resto
}: Props) {
  const esContrasena = type === 'password'
  const [visible, setVisible] = useState(false)
  const idError = `${id}-error`

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] font-semibold">
        {etiqueta}
      </label>
      <div
        className={`flex h-[52px] items-center gap-2.5 rounded-boton border bg-muro pl-3.5 text-ceniza focus-within:border-[1.5px] focus-within:border-llama focus-within:bg-muro focus-within:text-llama ${
          error ? 'border-exceso' : 'border-filo'
        } ${esContrasena ? 'pr-1.5' : 'pr-3.5'}`}
      >
        <Icon nombre={icono} tamano={20} className="shrink-0" />
        <input
          id={id}
          type={esContrasena && visible ? 'text' : type}
          value={valor}
          onChange={(evento) => onCambio(evento.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
          className="min-w-0 grow border-0 bg-transparent text-[15px] font-medium text-hueso outline-none"
          {...resto}
        />
        {sufijo && <span className="text-[13px] font-semibold">{sufijo}</span>}
        {esContrasena && (
          <button
            type="button"
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            onClick={() => setVisible((actual) => !actual)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-ceniza"
          >
            <Icon nombre={visible ? 'ojoTachado' : 'ojo'} tamano={20} />
          </button>
        )}
      </div>
      {error && (
        <p id={idError} className="text-xs font-semibold text-exceso">
          {error}
        </p>
      )}
    </div>
  )
}
