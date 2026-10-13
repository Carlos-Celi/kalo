import type { FormEvent, ReactNode } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
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
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-arena text-tinta hover:bg-borde"
        >
          <Icon nombre="flechaAtras" tamano={20} grosor={2} />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-[-0.5px] lg:text-[32px] lg:tracking-[-0.8px]">
            {titulo}
          </h1>
          <p className="text-[13px] leading-normal font-medium text-tinta-3">{descripcion}</p>
        </div>
      </header>

      <form
        noValidate
        onSubmit={enviar}
        aria-label={titulo}
        className="flex flex-col gap-6 rounded-tarjeta-lg border border-borde bg-white p-4 sm:p-6"
      >
        {children}

        <div className="flex flex-col gap-3 border-t border-divisor pt-5 sm:flex-row sm:items-center sm:justify-end">
          {fase === 'guardado' && (
            <div className="sm:mr-auto">
              <AvisoGuardado>{mensajeGuardado}</AvisoGuardado>
            </div>
          )}
          {fase === 'fallo' && (
            <p role="alert" className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error sm:mr-auto">
              No pudimos guardar los cambios. Inténtalo de nuevo.
            </p>
          )}
          <Link
            to={rutas.ajustes}
            className="flex h-[50px] items-center justify-center rounded-boton border border-borde px-5 text-[15px] font-bold text-tinta no-underline hover:bg-crema-suave"
          >
            {fase === 'guardado' ? 'Volver a Configuración' : 'Cancelar'}
          </Link>
          <button
            type="submit"
            disabled={deshabilitado || fase === 'guardando'}
            className="h-[50px] rounded-boton bg-kalo px-6 text-[15px] font-bold text-white hover:bg-kalo-oscuro disabled:opacity-50"
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
  return <h2 className="text-xs font-bold tracking-[0.8px] text-tinta-3 uppercase">{children}</h2>
}
