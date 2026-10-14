import { useState } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { Alerta } from '../../components/ui/Alerta'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { repositorios } from '../../data'
import { claveDia } from '../../domain/fechas'
import { borrarDatosLocales } from '../../lib/datosLocales'
import { cerrarSesion } from '../auth/acciones'
import { useAuth } from '../auth/contexto'
import { descargarMisDatos } from './exportarDatos'

const PALABRA = 'ELIMINAR'

const claseFila =
  'flex min-h-[52px] w-full items-center gap-3 border-b border-divisor text-left text-hueso no-underline last:border-b-0 hover:text-hueso disabled:opacity-50'

function Contenido({ icono, texto, detalle }: { icono: NombreIcono; texto: string; detalle?: string }) {
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-banco text-llama">
        <Icon nombre={icono} tamano={18} />
      </span>
      <span className="flex grow flex-col">
        <span className="text-sm font-semibold">{texto}</span>
        {detalle && <span className="text-xs text-ceniza">{detalle}</span>}
      </span>
      <Icon nombre="flechaAdelante" tamano={16} grosor={2} className="shrink-0 text-ceniza" />
    </>
  )
}

/** Derechos sobre los datos: descargarlos, leer las políticas y borrar la cuenta. */
export function CuentaYPrivacidad({ className = '' }: { className?: string }) {
  const auth = useAuth()
  const [descarga, setDescarga] = useState<'lista' | 'preparando' | 'fallo'>('lista')
  const [confirmando, setConfirmando] = useState(false)
  const [palabra, setPalabra] = useState('')
  const [borrado, setBorrado] = useState<'listo' | 'borrando' | 'fallo'>('listo')
  const conCuenta = auth.fase === 'autenticado'

  async function descargar() {
    setDescarga('preparando')
    try {
      await descargarMisDatos(claveDia(new Date()))
      setDescarga('lista')
    } catch {
      setDescarga('fallo')
    }
  }

  async function eliminar() {
    if (palabra.trim().toUpperCase() !== PALABRA) return
    setBorrado('borrando')
    try {
      await repositorios.perfil.eliminarCuenta()
    } catch {
      setBorrado('fallo')
      return
    }
    await borrarDatosLocales()
    // Sin sesión, la app vuelve sola a la pantalla de acceso.
    await cerrarSesion().catch(() => undefined)
  }

  return (
    <section aria-labelledby="ajustes-cuenta" className={`flex flex-col gap-2.5 ${className}`}>
      <h2 id="ajustes-cuenta" className="text-xs font-bold tracking-[0.8px] text-ceniza uppercase">
        Tu cuenta y tus datos
      </h2>
      <div className="rounded-tarjeta border border-filo bg-muro px-3.5">
        <button
          type="button"
          className={claseFila}
          disabled={descarga === 'preparando'}
          onClick={() => void descargar()}
        >
          <Contenido
            icono="descargar"
            texto={descarga === 'preparando' ? 'Preparando tus datos…' : 'Descargar mis datos'}
            detalle="Un archivo JSON con tu perfil y todos tus registros"
          />
        </button>
        <Link to={rutas.privacidad} className={claseFila}>
          <Contenido icono="escudo" texto="Política de privacidad" />
        </Link>
        <Link to={rutas.terminos} className={claseFila}>
          <Contenido icono="documento" texto="Términos de uso" />
        </Link>
        <Link to={rutas.cookies} className={claseFila}>
          <Contenido icono="candado" texto="Cookies y almacenamiento" />
        </Link>
      </div>
      {descarga === 'fallo' && (
        <Alerta titulo="No pudimos preparar tus datos">
          No se descargó nada. Revisa tu conexión y vuelve a pulsar «Descargar mis datos».
        </Alerta>
      )}

      {conCuenta && !confirmando && (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="flex h-[50px] items-center justify-center gap-2 rounded-boton border border-exceso/40 bg-transparent text-[15px] font-bold text-exceso hover:bg-exceso/10"
        >
          <Icon nombre="papelera" tamano={18} />
          Eliminar mi cuenta
        </button>
      )}

      {conCuenta && confirmando && (
        <div
          role="group"
          aria-labelledby="eliminar-titulo"
          className="flex flex-col gap-3 rounded-tarjeta border border-exceso/40 bg-exceso/10 p-4"
        >
          <h3 id="eliminar-titulo" className="text-[15px] font-bold text-exceso">
            ¿Eliminar tu cuenta para siempre?
          </h3>
          <p className="text-[13px] leading-normal text-hueso">
            Se borran del servidor tu perfil, tu plan, todos tus registros, tus fotos y tus
            recordatorios, y en este dispositivo tu API key y tus chats. No se puede deshacer. Si
            quieres conservar una copia, descarga antes tus datos.
          </p>
          <label htmlFor="confirmar-eliminar" className="text-[13px] font-semibold">
            Escribe {PALABRA} para confirmar
          </label>
          <input
            id="confirmar-eliminar"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={palabra}
            onChange={(evento) => setPalabra(evento.target.value)}
            className="h-[52px] rounded-boton border border-filo bg-sala px-3.5 text-[15px] font-bold tracking-[0.1em] text-hueso uppercase focus:border-exceso"
          />
          {borrado === 'fallo' && (
            <Alerta titulo="No pudimos eliminar la cuenta">
              Tus datos siguen intactos. Revisa tu conexión y vuelve a intentarlo; si se repite,
              cierra sesión, vuelve a entrar y prueba otra vez.
            </Alerta>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setConfirmando(false)
                setPalabra('')
                setBorrado('listo')
              }}
              className="h-[50px] rounded-boton border border-filo text-[15px] font-bold text-hueso hover:bg-muro"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={palabra.trim().toUpperCase() !== PALABRA || borrado === 'borrando'}
              onClick={() => void eliminar()}
              className="h-[50px] rounded-boton bg-exceso text-[15px] font-bold text-tinta hover:brightness-110 disabled:opacity-40"
            >
              {borrado === 'borrando' ? 'Eliminando…' : 'Eliminar'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
