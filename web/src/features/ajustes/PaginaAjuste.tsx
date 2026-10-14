import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { Alerta } from '../../components/ui/Alerta'
import { AvisoGuardado } from '../../components/ui/CamposNumericos'
import { Icon } from '../../components/ui/Icon'

import type { Fase } from './useGuardarAjuste'

interface Props {
  titulo: string
  descripcion: string
  fase: Fase
  /** Texto del aviso al terminar de guardar. */
  mensajeGuardado: string
  onEnviar: () => void
  /** Desactiva el botón (p. ej. si no hay cambios o falta algún dato). */
  deshabilitado?: boolean
  children: ReactNode
}

/**
 * Marco de las pantallas de edición de Configuración: vuelve a Configuración,
 * muestra el formulario en una tarjeta ancha y confirma al guardar.
 */
export function PaginaAjuste({
  titulo,
  descripcion,
  fase,
  mensajeGuardado,
  onEnviar,
  deshabilitado = false,
  children,
}: Props) {
  function enviar(evento: FormEvent) {
    evento.preventDefault()
    onEnviar()
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-5">
      <header className="flex items-center gap-3.5">
        <Link
          to={rutas.ajustes}
          aria-label="Volver a Configuración"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banco text-hueso hover:bg-filo"
        >
          <Icon nombre="flechaAtras" tamano={20} grosor={2} />
        </Link>
        <div className="min-w-0">
          <h1 className="num-marcador text-[40px] leading-[0.9] font-extrabold uppercase lg:text-[48px]">
            {titulo}
          </h1>
          <p className="text-[13px] leading-normal font-medium text-ceniza">{descripcion}</p>
        </div>
      </header>

      <form
        noValidate
        onSubmit={enviar}
        aria-label={titulo}
        className="flex flex-col gap-6 rounded-tarjeta-lg border border-filo bg-muro p-4 sm:p-6"
      >
        {children}

        <div className="flex flex-col gap-3 border-t border-divisor pt-5 sm:flex-row sm:items-center sm:justify-end">
          {fase === 'guardado' && (
            <div className="sm:mr-auto">
              <AvisoGuardado>{mensajeGuardado}</AvisoGuardado>
            </div>
          )}
          {fase === 'fallo' && (
            <Alerta titulo="No pudimos guardar los cambios" className="sm:mr-auto">
              Puede ser la conexión. Lo que escribiste sigue aquí: vuelve a intentarlo en un momento.
            </Alerta>
          )}
          <Link
            to={rutas.ajustes}
            className="flex h-[50px] items-center justify-center rounded-boton border border-filo px-5 text-[15px] font-bold text-hueso no-underline hover:bg-muro"
          >
            {fase === 'guardado' ? 'Volver a Configuración' : 'Cancelar'}
          </Link>
          <button
            type="submit"
            disabled={deshabilitado || fase === 'guardando'}
            className="h-[50px] rounded-boton bg-brasa px-6 text-[15px] font-bold text-white hover:bg-brasa-hover disabled:opacity-50"
          >
            {fase === 'guardando' ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

/** Título de una sección dentro de un formulario de Configuración. */
export function TituloSeccion({ children }: { children: ReactNode }) {
  return <h2 className="text-xs font-bold tracking-[0.8px] text-ceniza uppercase">{children}</h2>
}
