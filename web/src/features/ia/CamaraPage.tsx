import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Icon } from '../../components/ui/Icon'
import { claveDia, esClaveDia } from '../../domain/fechas'
import { TIPOS_COMIDA, type TipoComida } from '../../domain/registros'
import { tiposDeComida } from '../registros/comidaBorrador'
import { useConfigIA } from './config'
import { dejarFoto, prepararFoto } from './foto'

type EstadoCamara = 'iniciando' | 'lista' | 'sin-permiso' | 'no-disponible'

const mensajeCamara: Record<Exclude<EstadoCamara, 'lista'>, string> = {
  iniciando: 'Abriendo la cámara…',
  'sin-permiso':
    'Kalo no tiene permiso para usar la cámara. Actívalo en los permisos del sitio o elige una foto de tu galería.',
  'no-disponible': 'No encontramos una cámara en este dispositivo. Elige una foto de tu galería.',
}

const hayCamara = () => typeof navigator.mediaDevices?.getUserMedia === 'function'

/** Foto de la comida para analizarla con IA (design/Camara.dc.html). */
export function CamaraPage() {
  useTitulo('Foto de tu comida')
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const { config } = useConfigIA()
  const video = useRef<HTMLVideoElement>(null)
  const archivo = useRef<HTMLInputElement>(null)
  const [hoy] = useState(() => claveDia(new Date()))
  const [tipo, setTipo] = useState<TipoComida>(
    () => TIPOS_COMIDA.find((otro) => otro === parametros.get('tipo')) ?? 'almuerzo',
  )
  const [camara, setCamara] = useState<EstadoCamara>(() => (hayCamara() ? 'iniciando' : 'no-disponible'))
  const [aviso, setAviso] = useState<string | null>(null)

  const pedida = parametros.get('fecha') ?? ''
  const fecha = esClaveDia(pedida) ? pedida : hoy
  const busqueda = `?tipo=${tipo}&fecha=${fecha}`
  const iaLista = config !== null

  useEffect(() => {
    if (!iaLista) return
    if (!hayCamara()) return
    let vigente = true
    let flujo: MediaStream | null = null
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((obtenido) => {
        flujo = obtenido
        if (!vigente) return obtenido.getTracks().forEach((pista) => pista.stop())
        if (video.current) video.current.srcObject = obtenido
        setCamara('lista')
      })
      .catch((error: unknown) => {
        if (!vigente) return
        const denegado = error instanceof DOMException && error.name === 'NotAllowedError'
        setCamara(denegado ? 'sin-permiso' : 'no-disponible')
      })
    return () => {
      vigente = false
      // La cámara se apaga al salir de la pantalla.
      flujo?.getTracks().forEach((pista) => pista.stop())
    }
  }, [iaLista])

  function analizar(fuente: CanvasImageSource, ancho: number, alto: number) {
    const preparada = prepararFoto(fuente, ancho, alto)
    if (!preparada) return setAviso('No pudimos leer esa imagen. Prueba con otra.')
    dejarFoto({ ...preparada, tipo, fecha })
    void navegar(rutas.analisis)
  }

  function tomar() {
    const origen = video.current
    if (origen && camara === 'lista') analizar(origen, origen.videoWidth, origen.videoHeight)
  }

  async function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0]
    evento.target.value = ''
    if (!elegido) return
    try {
      const imagen = await createImageBitmap(elegido)
      analizar(imagen, imagen.width, imagen.height)
      imagen.close()
    } catch {
      setAviso('No pudimos leer esa imagen. Prueba con otra.')
    }
  }

  const claseLateral = 'flex w-[72px] flex-col items-center gap-1.5 text-xs font-semibold text-white no-underline hover:text-white disabled:opacity-50'
  const claseIcono = 'flex size-12 items-center justify-center rounded-full bg-camara-chip'

  return (
    <div className="min-h-dvh bg-camara lg:flex lg:items-center lg:justify-center lg:p-10">
      <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col gap-4 bg-camara px-4 pt-[max(20px,env(safe-area-inset-top))] pb-[30px] text-white lg:min-h-[760px] lg:max-w-[760px] lg:rounded-[28px]">
        <div className="flex items-center gap-3.5">
          <Link
            to={`${rutas.registros}?fecha=${fecha}`}
            aria-label="Cerrar"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-camara-chip text-white hover:text-white"
          >
            <Icon nombre="cerrar" tamano={20} grosor={2} />
          </Link>
          <h1 className="grow pr-[58px] text-center text-base font-bold">Foto de tu comida</h1>
        </div>

        {/* Una sola fila con desplazamiento: en 390 px cinco chips envueltos dejaban "Licor" solo. */}
        <div
          role="group"
          aria-label="Tipo de comida"
          className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:justify-center lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {TIPOS_COMIDA.map((otro) => {
            const activo = otro === tipo
            return (
              <button
                key={otro}
                type="button"
                aria-pressed={activo}
                onClick={() => setTipo(otro)}
                className={`min-h-11 shrink-0 snap-start rounded-full px-3.5 text-[13px] ${
                  activo ? 'bg-llama font-bold text-camara' : 'bg-camara-chip font-semibold text-white'
                }`}
              >
                {activo && <span aria-hidden="true">✓ </span>}
                {tiposDeComida[otro].etiqueta}
              </button>
            )
          })}
        </div>

        <div className="relative flex min-h-[320px] grow items-center justify-center overflow-hidden rounded-3xl bg-camara-visor">
          {iaLista ? (
            <>
              <video
                ref={video}
                autoPlay
                playsInline
                muted
                aria-label="Vista previa de la cámara"
                className={`absolute inset-0 size-full object-cover ${camara === 'lista' ? '' : 'hidden'}`}
              />
              {camara === 'lista' ? (
                <div className="absolute top-3.5 flex items-center gap-1.5 rounded-full bg-camara/70 px-3 py-1.5 text-xs font-bold">
                  <Icon nombre="destello" tamano={14} grosor={2.2} className="text-llama" />
                  IA lista · centra el plato
                </div>
              ) : (
                <p role="status" className="max-w-[260px] text-center text-[13px] leading-normal font-semibold">
                  {mensajeCamara[camara]}
                </p>
              )}
              {(['top-[18px] left-[18px] rounded-tl-xl border-t-[3px] border-l-[3px]', 'top-[18px] right-[18px] rounded-tr-xl border-t-[3px] border-r-[3px]', 'bottom-[18px] left-[18px] rounded-bl-xl border-b-[3px] border-l-[3px]', 'bottom-[18px] right-[18px] rounded-br-xl border-r-[3px] border-b-[3px]'] as const).map(
                (esquina) => (
                  <div key={esquina} aria-hidden="true" className={`absolute size-9 border-white ${esquina}`} />
                ),
              )}
            </>
          ) : (
            <div className="flex max-w-[280px] flex-col items-center gap-3 p-4 text-center">
              <Icon nombre="llave" tamano={32} className="text-llama" />
              <p className="text-sm leading-normal font-semibold">
                Para analizar fotos, conecta tu proveedor de IA. Mientras tanto puedes registrar la
                comida a mano.
              </p>
              {/* Mucha gente no tendrá API key: el registro a mano es la salida principal. */}
              <Link
                to={`${rutas.comidaManual}${busqueda}`}
                className="flex h-12 items-center gap-2 rounded-full bg-llama px-5 text-sm font-bold text-camara no-underline hover:text-camara"
              >
                <Icon nombre="lapiz" tamano={18} />
                Registrar a mano
              </Link>
              <Link
                to={rutas.proveedorIA}
                className="flex h-11 items-center rounded-full bg-camara-chip px-4 text-[13px] font-bold text-white no-underline hover:text-white"
              >
                Configurar la IA
              </Link>
            </div>
          )}
        </div>

        <p aria-live="polite" className="text-center text-[13px] font-medium text-kalo-claro">
          {aviso ??
            (iaLista
              ? 'La IA estimará calorías, azúcar y grasa en segundos.'
              : 'Sin IA conectada solo puedes registrar a mano.')}
        </p>

        <div className="flex items-center justify-between px-2">
          <button type="button" disabled={!iaLista} onClick={() => archivo.current?.click()} className={claseLateral}>
            <span className={claseIcono}>
              <Icon nombre="imagen" tamano={22} />
            </span>
            Galería
          </button>
          <input
            ref={archivo}
            type="file"
            accept="image/*"
            onChange={(evento) => void elegir(evento)}
            aria-label="Elegir una foto de la galería"
            className="sr-only"
            tabIndex={-1}
          />
          <button
            type="button"
            aria-label="Tomar foto y analizar"
            disabled={camara !== 'lista' || !iaLista}
            onClick={tomar}
            className="flex size-[82px] items-center justify-center rounded-full border-4 border-white disabled:opacity-40"
          >
            <span className="size-16 rounded-full bg-white" />
          </button>
          <Link to={`${rutas.comidaManual}${busqueda}`} className={claseLateral}>
            <span className={claseIcono}>
              <Icon nombre="lapiz" tamano={22} />
            </span>
            Manual
          </Link>
        </div>
      </main>
    </div>
  )
}
