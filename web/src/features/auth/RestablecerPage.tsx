import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { CampoTexto } from '../../components/ui/CampoTexto'
import { cambiarContrasena } from './acciones'
import { useAuth } from './contexto'
import { MarcoAcceso } from './MarcoAcceso'
import { mensajeDeFallo } from './mensajes'
import { CONTRASENA_MINIMO, validarContrasenaNueva } from './validacion'

/**
 * Destino del enlace de recuperación. Al llegar, Supabase canjea el código
 * del enlace por una sesión; solo con esa sesión se puede fijar la contraseña.
 */
export function RestablecerPage() {
  useTitulo('Nueva contraseña')
  const auth = useAuth()
  const navegar = useNavigate()
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (auth.fase === 'demo') return <Navigate to={rutas.login} replace />

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (enviando) return
    const errorContrasena = validarContrasenaNueva(contrasena)
    setError(errorContrasena)
    if (errorContrasena) return

    setEnviando(true)
    setFallo(null)
    const resultado = await cambiarContrasena(contrasena).catch(
      () => ({ ok: false, motivo: 'desconocido' }) as const,
    )
    setEnviando(false)
    if (!resultado.ok) {
      setFallo(mensajeDeFallo[resultado.motivo])
      return
    }
    void navegar(rutas.inicio, { replace: true })
  }

  return (
    <MarcoAcceso lema="Elige una contraseña nueva para tu cuenta.">
      <h1 className="sr-only">Nueva contraseña</h1>

      {auth.fase === 'cargando' && (
        <p role="status" className="text-center text-sm font-medium text-tinta-3">
          Comprobando el enlace…
        </p>
      )}

      {auth.fase === 'anonimo' && (
        <>
          <p role="alert" className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] leading-normal font-semibold text-error">
            El enlace no es válido o ya caducó. Pide uno nuevo y ábrelo en el mismo navegador en
            el que lo solicitaste.
          </p>
          <Button to={rutas.login} tamano="xl">
            Volver a iniciar sesión
          </Button>
        </>
      )}

      {auth.fase === 'autenticado' && (
        <form noValidate onSubmit={(evento) => void enviar(evento)} className="flex flex-col gap-4">
          <CampoTexto
            id="contrasena-nueva"
            etiqueta="Contraseña nueva"
            icono="candado"
            type="password"
            autoComplete="new-password"
            placeholder={`Mínimo ${CONTRASENA_MINIMO} caracteres`}
            maxLength={128}
            valor={contrasena}
            onCambio={setContrasena}
            error={error}
          />
          {fallo && (
            <p role="alert" className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] leading-normal font-semibold text-error">
              {fallo}
            </p>
          )}
          <Button type="submit" tamano="xl" disabled={enviando}>
            {enviando ? 'Un momento…' : 'Guardar contraseña'}
          </Button>
        </form>
      )}
    </MarcoAcceso>
  )
}
