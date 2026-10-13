import { useEffect, useRef } from 'react'

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface ApiTurnstile {
  render(
    contenedor: HTMLElement,
    opciones: {
      sitekey: string
      language: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ): string
  remove(id: string): void
}

declare global {
  interface Window {
    turnstile?: ApiTurnstile
  }
}

let carga: Promise<ApiTurnstile> | null = null

function cargarTurnstile(): Promise<ApiTurnstile> {
  carga ??= new Promise<ApiTurnstile>((resolver, rechazar) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () =>
      window.turnstile ? resolver(window.turnstile) : rechazar(new Error('Turnstile no disponible'))
    script.onerror = () => {
      carga = null
      rechazar(new Error('No se pudo cargar Turnstile'))
    }
    document.head.append(script)
  })
  return carga
}

interface Props {
  claveSitio: string
  /** Recibe el token al resolverse el reto y null cuando caduca o falla. */
  onToken: (token: string | null) => void
}

/**
 * Reto CAPTCHA de Cloudflare Turnstile. Cada token vale para un solo envío:
 * para pedir otro, quien lo usa vuelve a montar el componente cambiando `key`.
 */
export function Turnstile({ claveSitio, onToken }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const avisar = useRef(onToken)

  useEffect(() => {
    avisar.current = onToken
  }, [onToken])

  useEffect(() => {
    let vigente = true
    let api: ApiTurnstile | undefined
    let id: string | undefined

    cargarTurnstile()
      .then((turnstile) => {
        if (!vigente || !contenedor.current) return
        api = turnstile
        id = turnstile.render(contenedor.current, {
          sitekey: claveSitio,
          language: 'es',
          callback: (token) => avisar.current(token),
          'expired-callback': () => avisar.current(null),
          'error-callback': () => avisar.current(null),
        })
      })
      .catch(() => avisar.current(null))

    return () => {
      vigente = false
      if (api && id) api.remove(id)
    }
  }, [claveSitio])

  return <div ref={contenedor} className="flex min-h-[65px] justify-center" />
}
