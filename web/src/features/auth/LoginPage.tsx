import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Alerta } from '../../components/ui/Alerta'
import { Button } from '../../components/ui/Button'
import { CampoTexto } from '../../components/ui/CampoTexto'
import { Icon } from '../../components/ui/Icon'
import { leerClaveTurnstile } from '../../lib/env'
import { crearCuenta, iniciarSesion, pedirRecuperacion, type Resultado } from './acciones'
import { useAuth } from './contexto'
import { FRENO_INICIAL, guardarFreno, leerFreno, segundosDeEspera, trasFallo } from './freno'
import { MarcoAcceso } from './MarcoAcceso'
import { CUENTA_CREADA, mensajeDeFallo, RECUPERACION_ENVIADA } from './mensajes'
import type { EstadoDeLogin } from './RutaProtegida'
import { Turnstile } from './Turnstile'
import {
  CONTRASENA_MINIMO,
  validarContrasenaExistente,
  validarContrasenaNueva,
  validarCorreo,
} from './validacion'

type Modo = 'entrar' | 'crear' | 'recuperar'

interface Aviso {
  tipo: 'error' | 'info'
  /** Qué falló, según lo que se intentaba hacer. */
  titulo?: string
  texto: string
}

const tituloDeFallo: Record<Modo, string> = {
  entrar: 'No pudimos iniciar sesión',
  crear: 'No pudimos crear la cuenta',
  recuperar: 'No pudimos enviar el enlace',
}

const textos: Record<Modo, { titulo: string; lema: string; enviar: string }> = {
  entrar: {
    titulo: 'Iniciar sesión',
    lema: 'Inicia sesión y sigue encendiendo tus hábitos.',
    enviar: 'Iniciar sesión',
  },
  crear: {
    titulo: 'Crear cuenta',
    lema: 'Crea tu cuenta y empieza a encender tus hábitos.',
    enviar: 'Crear cuenta',
  },
  recuperar: {
    titulo: 'Recuperar contraseña',
    lema: 'Te enviaremos un enlace para elegir una contraseña nueva.',
    enviar: 'Enviar enlace',
  },
}

const claveTurnstile = leerClaveTurnstile()

/** Solo se vuelve a rutas internas: nunca a una URL externa ni al propio login. */
function destinoSeguro(estado: unknown): string {
  const desde = (estado as EstadoDeLogin | null)?.desde
  if (typeof desde !== 'string') return rutas.inicio
  const interna = desde.startsWith('/') && !desde.startsWith('//') && !desde.includes('\\')
  return interna && desde !== rutas.login ? desde : rutas.inicio
}

export function LoginPage() {
  const auth = useAuth()
  const ubicacion = useLocation()

  const [modo, setModo] = useState<Modo>('entrar')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [errores, setErrores] = useState<{
    correo?: string | null
    contrasena?: string | null
    consentimiento?: string | null
  }>({})
  const [acepta, setAcepta] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [captcha, setCaptcha] = useState<{ ronda: number; token: string | null }>({
    ronda: 0,
    token: null,
  })
  const [freno, setFreno] = useState(leerFreno)
  const [ahora, setAhora] = useState(() => Date.now())

  useTitulo(textos[modo].titulo)

  const espera = modo === 'entrar' ? segundosDeEspera(freno, ahora) : 0

  useEffect(() => {
    if (espera === 0) return
    const reloj = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(reloj)
  }, [espera])

  if (auth.fase === 'autenticado') {
    return <Navigate to={destinoSeguro(ubicacion.state)} replace />
  }

  const esDemo = auth.fase === 'demo'
  const faltaCaptcha = Boolean(claveTurnstile) && !captcha.token
  const bloqueado = enviando || esDemo || espera > 0 || faltaCaptcha

  function cambiarModo(nuevo: Modo) {
    setModo(nuevo)
    setErrores({})
    setAviso(null)
    setContrasena('')
    setAcepta(false)
  }

  function actualizarFreno(nuevo: typeof freno) {
    setFreno(nuevo)
    guardarFreno(nuevo)
    setAhora(Date.now())
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (bloqueado) return

    const errorCorreo = validarCorreo(correo)
    const errorContrasena =
      modo === 'recuperar'
        ? null
        : modo === 'crear'
          ? validarContrasenaNueva(contrasena)
          : validarContrasenaExistente(contrasena)
    const errorConsentimiento =
      modo === 'crear' && !acepta ? 'Para crear la cuenta tienes que aceptarlo.' : null
    setErrores({ correo: errorCorreo, contrasena: errorContrasena, consentimiento: errorConsentimiento })
    if (errorCorreo || errorContrasena || errorConsentimiento) return

    setEnviando(true)
    setAviso(null)
    const token = captcha.token ?? undefined
    let resultado: Resultado
    try {
      if (modo === 'entrar') resultado = await iniciarSesion(correo, contrasena, token)
      else if (modo === 'crear') resultado = await crearCuenta(correo, contrasena, token)
      else resultado = await pedirRecuperacion(correo, token)
    } catch {
      // Sin red o respuesta inesperada: mismo mensaje genérico.
      resultado = { ok: false, motivo: 'desconocido' }
    }
    setEnviando(false)
    // Cada token de CAPTCHA vale para un solo envío.
    setCaptcha((actual) => ({ ronda: actual.ronda + 1, token: null }))

    if (!resultado.ok) {
      if (modo === 'entrar' && resultado.motivo === 'credenciales') {
        actualizarFreno(trasFallo(freno, Date.now()))
      }
      setAviso({ tipo: 'error', titulo: tituloDeFallo[modo], texto: mensajeDeFallo[resultado.motivo] })
      return
    }

    if (modo === 'entrar') {
      actualizarFreno(FRENO_INICIAL)
      return // AuthProvider detecta la sesión y esta pantalla redirige.
    }
    setContrasena('')
    setModo('entrar')
    setAviso({ tipo: 'info', texto: modo === 'crear' ? CUENTA_CREADA : RECUPERACION_ENVIADA })
  }

  return (
    <MarcoAcceso lema={textos[modo].lema}>
      <h1 className="sr-only">{textos[modo].titulo}</h1>

      <form
        id="acceso"
        noValidate
        onSubmit={(evento) => void enviar(evento)}
        className="flex flex-col gap-4"
      >
        <CampoTexto
          id="correo"
          etiqueta="Correo electrónico"
          icono="sobre"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="tucorreo@ejemplo.com"
          maxLength={254}
          valor={correo}
          onCambio={setCorreo}
          error={errores.correo}
          disabled={esDemo}
        />
        {modo !== 'recuperar' && (
          <CampoTexto
            id="contrasena"
            etiqueta="Contraseña"
            icono="candado"
            type="password"
            autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
            placeholder={
              modo === 'crear'
                ? `Mínimo ${CONTRASENA_MINIMO}, con letras y números`
                : `Mínimo ${CONTRASENA_MINIMO} caracteres`
            }
            maxLength={128}
            valor={contrasena}
            onCambio={setContrasena}
            error={errores.contrasena}
            disabled={esDemo}
          />
        )}
        {modo === 'entrar' && !esDemo && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => cambiarModo('recuperar')}
              className="-my-2.5 min-h-11 text-[13px] font-bold text-llama hover:text-llama"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}
        {modo === 'crear' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="consentimiento" className="flex cursor-pointer items-start gap-3 text-[13px] leading-normal text-ceniza">
              <input
                id="consentimiento"
                type="checkbox"
                checked={acepta}
                onChange={(evento) => setAcepta(evento.target.checked)}
                aria-invalid={errores.consentimiento ? true : undefined}
                aria-describedby={errores.consentimiento ? 'consentimiento-error' : undefined}
                className="mt-0.5 size-5 shrink-0 accent-brasa"
              />
              <span>
                Acepto los{' '}
                <Link to={rutas.terminos} className="font-semibold text-llama">
                  términos de uso
                </Link>{' '}
                y la{' '}
                <Link to={rutas.privacidad} className="font-semibold text-llama">
                  política de privacidad
                </Link>
                , y consiento que Kalo trate mis datos de salud (comidas, peso, sueño y condiciones
                que indique) para calcular mi plan.
              </span>
            </label>
            {errores.consentimiento && (
              <p id="consentimiento-error" className="text-xs font-semibold text-exceso">
                {errores.consentimiento}
              </p>
            )}
          </div>
        )}
        {claveTurnstile && !esDemo && (
          <Turnstile
            key={captcha.ronda}
            claveSitio={claveTurnstile}
            onToken={(token) => setCaptcha((actual) => ({ ...actual, token }))}
          />
        )}
      </form>

      <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
        {aviso && (
          aviso.tipo === 'error' ? (
            <Alerta titulo={aviso.titulo ?? 'No pudimos completar la operación'}>{aviso.texto}</Alerta>
          ) : (
            <p
              role="status"
              className="rounded-boton-sm bg-banco px-3.5 py-3 text-[13px] leading-normal font-semibold text-llama"
            >
              {aviso.texto}
            </p>
          )
        )}
        {espera > 0 && (
          <p role="status" className="text-center text-[13px] font-semibold text-ceniza">
            Demasiados intentos fallidos. Podrás reintentar en {espera} s.
          </p>
        )}
        {esDemo && (
          <p role="status" className="rounded-boton bg-peso-luz/15 px-3.5 py-3 text-[13px] leading-normal font-semibold text-peso-luz">
            Modo demostración: no hay un servidor de cuentas configurado, así que la app muestra
            datos de ejemplo.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5 rounded-boton bg-banco px-3.5 py-3 text-xs leading-normal font-semibold text-llama">
        <Icon nombre="escudo" tamano={18} className="shrink-0" />
        Tus datos viajan cifrados, no se venden y puedes borrarlos cuando quieras.
      </div>

      <div className="mt-auto flex flex-col gap-3 lg:mt-2">
        {esDemo ? (
          <Button to={rutas.inicio} tamano="xl">
            Entrar en modo demostración
          </Button>
        ) : (
          <>
            <Button type="submit" form="acceso" tamano="xl" disabled={bloqueado}>
              {enviando ? 'Un momento…' : textos[modo].enviar}
            </Button>
            <Button
              variante="suave"
              tamano="xl"
              onClick={() => cambiarModo(modo === 'entrar' ? 'crear' : 'entrar')}
            >
              {modo === 'entrar' ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
            </Button>
          </>
        )}
      </div>
      <nav aria-label="Documentos legales" className="flex justify-center gap-5 text-xs">
        <Link to={rutas.privacidad} className="flex min-h-11 items-center font-semibold text-ceniza hover:text-hueso">
          Privacidad
        </Link>
        <Link to={rutas.terminos} className="flex min-h-11 items-center font-semibold text-ceniza hover:text-hueso">
          Términos
        </Link>
        <Link to={rutas.cookies} className="flex min-h-11 items-center font-semibold text-ceniza hover:text-hueso">
          Cookies
        </Link>
      </nav>
    </MarcoAcceso>
  )
}
