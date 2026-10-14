import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Alerta } from '../../components/ui/Alerta'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import {
  ErrorIA,
  LIMITE_API_KEY,
  mensajeDeFalloIA,
  PROVEEDORES,
  proveedores,
  type ModeloIA,
  type Proveedor,
} from '../../domain/ia'
import { crearClienteIA, useConfigIA } from './config'

type Prueba =
  | { fase: 'sin-probar' }
  | { fase: 'probando' }
  | { fase: 'conectada' }
  | { fase: 'fallo'; mensaje: string; codigo: string | null }

interface Props {
  /** Se llama al guardar la configuración o al quitar la clave. */
  onTerminar: () => void
  /** Acción adicional junto a los botones (p. ej. «Más tarde» en el onboarding). */
  extra?: ReactNode
}

/** Proveedor, API key y modelo de la IA (design/ProveedorIA.dc.html), sin marco de pantalla. */
export function FormularioProveedorIA({ onTerminar, extra }: Props) {
  const { config, guardar, borrar, leerClave } = useConfigIA()

  const [proveedor, setProveedor] = useState<Proveedor>(config?.proveedor ?? 'anthropic')
  const [apiKey, setApiKey] = useState('')
  const [claveGuardada, setClaveGuardada] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [modelos, setModelos] = useState<ModeloIA[]>(
    config ? [{ id: config.modelo, nombre: config.nombreModelo }] : [],
  )
  const [modelo, setModelo] = useState(config?.modelo ?? '')
  const [prueba, setPrueba] = useState<Prueba>(
    config?.verificada ? { fase: 'conectada' } : { fase: 'sin-probar' },
  )

  // Al abrir la pantalla se descifra la clave guardada y, con ella, se carga
  // la lista de modelos: así se puede cambiar de modelo sin volver a probar.
  const [guardada] = useState(config)
  const mismoProveedor = useRef(true)
  useEffect(() => {
    let vigente = true
    void (async () => {
      const apiKeyGuardada = await leerClave()
      if (!vigente || !apiKeyGuardada) return
      setClaveGuardada(apiKeyGuardada)
      if (!guardada) return
      try {
        const cliente = await crearClienteIA(guardada.proveedor, apiKeyGuardada)
        const disponibles = await cliente.listarModelos()
        // Si mientras tanto se cambió de proveedor, esta lista ya no aplica.
        if (vigente && mismoProveedor.current) {
          setModelos((actuales) => (actuales.length <= 1 ? disponibles : actuales))
        }
      } catch {
        // Sin conexión o con la clave caducada queda el modelo guardado; "Probar conexión" lo explica.
      }
    })()
    return () => {
      vigente = false
    }
  }, [leerClave, guardada])

  const datos = proveedores[proveedor]
  // Una clave no lleva espacios: al pegarla se cuelan saltos de línea con facilidad.
  const escrita = apiKey.replace(/\s+/g, '')
  // Con el campo vacío vale la clave ya guardada, mientras no se cambie de proveedor.
  const conservada = guardada?.proveedor === proveedor ? claveGuardada : null
  const clave = escrita || conservada || ''
  const elegido = modelos.find((otro) => otro.id === modelo)
  const conectada = prueba.fase === 'conectada'

  function cambiarProveedor(nuevo: Proveedor) {
    if (nuevo === proveedor) return
    mismoProveedor.current = false
    setProveedor(nuevo)
    setApiKey('')
    setModelos([])
    setModelo('')
    setPrueba({ fase: 'sin-probar' })
  }

  async function probar() {
    if (!clave || prueba.fase === 'probando') return
    setPrueba({ fase: 'probando' })
    try {
      const cliente = await crearClienteIA(proveedor, clave)
      const disponibles = await cliente.listarModelos()
      if (disponibles.length === 0) throw new ErrorIA('modelo')
      setModelos(disponibles)
      // Se conserva el modelo elegido si sigue disponible; si no, el recomendado.
      const preferido =
        disponibles.find((otro) => otro.id === modelo) ??
        disponibles.find((otro) => otro.id === datos.modeloPorDefecto) ??
        disponibles[0]
      setModelo(preferido.id)
      setPrueba({ fase: 'conectada' })
    } catch (error) {
      const motivo = error instanceof ErrorIA ? error.motivo : 'desconocido'
      setPrueba({
        fase: 'fallo',
        // Aquí aún no hay modelo elegido: un "modelo no disponible" es que el proveedor no aceptó la petición.
        mensaje:
          motivo === 'modelo'
            ? `${datos.nombre} no aceptó la petición. Comprueba que la clave es de ${datos.nombre} y que tiene acceso a sus modelos.`
            : mensajeDeFalloIA[motivo],
        codigo: error instanceof ErrorIA ? error.codigo : null,
      })
    }
  }

  function alGuardar(evento: FormEvent) {
    evento.preventDefault()
    if (!clave || !elegido) return
    void guardar(
      { proveedor, modelo: elegido.id, nombreModelo: elegido.nombre, verificada: conectada },
      clave,
    ).then(onTerminar)
  }

  const estado = conectada
    ? { titulo: 'IA conectada', detalle: `${datos.nombre}${elegido ? ` · ${elegido.nombre}` : ''}` }
    : prueba.fase === 'probando'
      ? { titulo: 'Probando la conexión…', detalle: `Consultando a ${datos.nombre}` }
      : {
          titulo: 'Falta verificar la conexión',
          detalle: 'Pulsa «Probar conexión» para validar tu clave',
        }

  return (
    <form noValidate onSubmit={alGuardar} className="flex grow flex-col gap-4">
      <div
        role="status"
        className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 ${
          conectada ? 'bg-banco text-llama' : 'bg-peso-luz/15 text-peso-luz'
        }`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muro">
          <Icon nombre={conectada ? 'check' : 'destello'} tamano={18} grosor={2.2} />
        </span>
        <span className="flex flex-col">
          <span className="text-sm font-extrabold">{estado.titulo}</span>
          <span className="text-xs font-medium">{estado.detalle}</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-2.5 text-[13px] font-bold">1. Elige tu proveedor</legend>
        <div className="grid grid-cols-3 gap-2">
          {PROVEEDORES.map((otro) => {
            const activo = otro === proveedor
            return (
              <label
                key={otro}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl p-3 text-center has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-llama ${
                  activo ? 'border-[1.5px] border-llama bg-banco' : 'border border-filo bg-muro'
                }`}
              >
                <input
                  type="radio"
                  name="proveedor"
                  value={otro}
                  checked={activo}
                  onChange={() => cambiarProveedor(otro)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`flex size-9 items-center justify-center rounded-boton-sm text-base font-extrabold ${
                    activo ? 'bg-brasa text-white' : 'bg-banco text-ceniza'
                  }`}
                >
                  {proveedores[otro].inicial}
                </span>
                <span className="text-[13px] font-bold">{proveedores[otro].nombre}</span>
                <span className="text-xs font-medium text-ceniza">{proveedores[otro].familia}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="apikey" className="text-[13px] font-bold">
          2. Pega tu API key
        </label>
        <div className="flex h-[52px] items-center gap-2.5 rounded-boton border border-filo bg-muro pr-1.5 pl-3.5 text-ceniza focus-within:border-[1.5px] focus-within:border-llama focus-within:bg-muro focus-within:text-llama">
          <Icon nombre="llave" tamano={20} className="shrink-0" />
          <input
            id="apikey"
            // No es `type="password"` a propósito: el navegador lo rellenaría con la
            // contraseña guardada de Kalo. Se enmascara con estilo.
            type="text"
            name="kalo-clave-ia"
            autoComplete="off"
            autoCorrect="off"
            data-1p-ignore
            data-lpignore="true"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={LIMITE_API_KEY}
            placeholder={conservada ? 'Clave guardada · pega otra para cambiarla' : datos.ejemploClave}
            value={apiKey}
            onChange={(evento) => {
              setApiKey(evento.target.value)
              setPrueba({ fase: 'sin-probar' })
            }}
            aria-describedby="apikey-nota"
            className={`min-w-0 grow border-0 bg-transparent text-[15px] font-medium text-hueso outline-none ${visible ? '' : 'texto-oculto'}`}
          />
          <button
            type="button"
            aria-label={visible ? 'Ocultar la clave' : 'Mostrar la clave'}
            aria-pressed={visible}
            onClick={() => setVisible((actual) => !actual)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-ceniza"
          >
            <Icon nombre={visible ? 'ojoTachado' : 'ojo'} tamano={20} />
          </button>
        </div>
        <p
          id="apikey-nota"
          className="flex gap-2 text-xs leading-normal font-medium text-ceniza"
        >
          <Icon nombre="candado" tamano={16} className="mt-0.5 shrink-0" />
          Tu clave se guarda cifrada en este navegador y se envía únicamente a tu proveedor. El uso
          de la IA se cobra en tu cuenta de ese proveedor.
        </p>
        <a
          href={datos.urlClaves}
          target="_blank"
          rel="noopener noreferrer"
          className="-my-2 flex min-h-11 items-center self-start text-[13px] font-bold"
        >
          ¿Dónde consigo mi API key?
        </a>
      </div>

        </div>
        <div className="flex flex-col">
      <fieldset className="flex flex-col">
        <legend className="mb-2.5 flex w-full items-baseline justify-between gap-2">
          <span className="text-[13px] font-bold">3. Elige el modelo</span>
          <span className="text-xs font-medium text-ceniza">
            {modelos.length > 1 ? 'Lista cargada desde tu proveedor' : 'Prueba la conexión para cargarla'}
          </span>
        </legend>
        {modelos.length === 0 ? (
          <p className="rounded-boton bg-muro px-3.5 py-3 text-xs font-medium text-ceniza">
            Cuando la conexión funcione verás aquí los modelos disponibles para tu clave.
          </p>
        ) : (
          // `relative`: los radios `sr-only` son absolutos; sin un ancestro posicionado
          // alargan la página y, al enfocarlos, la ventana salta a una zona en blanco.
          <div className="relative flex max-h-64 flex-col gap-2 overflow-y-auto">
            {modelos.map((otro) => {
              const activo = otro.id === modelo
              return (
                <label
                  key={otro.id}
                  className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-boton px-3.5 py-2 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-llama ${
                    activo ? 'border-[1.5px] border-llama bg-banco' : 'border border-filo bg-muro'
                  }`}
                >
                  <input
                    type="radio"
                    name="modelo"
                    value={otro.id}
                    checked={activo}
                    onChange={() => setModelo(otro.id)}
                    className="sr-only"
                  />
                  <span className="flex min-w-0 grow flex-col">
                    <span className="truncate text-sm font-bold">{otro.nombre}</span>
                    <span className="truncate text-xs font-medium text-ceniza">
                      {otro.id === datos.modeloPorDefecto ? 'Recomendado' : otro.id}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-[22px] shrink-0 items-center justify-center rounded-full ${
                      activo ? 'bg-brasa text-white' : 'border-[1.5px] border-filo bg-muro'
                    }`}
                  >
                    {activo && <Icon nombre="check" tamano={14} grosor={3} />}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </fieldset>
        </div>
      </div>

      <p className="text-xs leading-normal font-medium text-ceniza">
        Esta IA se usa para analizar fotos de comida, completar calorías y proteína, y para el
        asistente nutriólogo.
      </p>

      <div className="mt-auto flex flex-col gap-2.5 pt-2">
        {prueba.fase === 'fallo' && (
          <Alerta titulo="La conexión con tu proveedor no funcionó">
            {prueba.mensaje}
            {prueba.codigo && (
              <span className="mt-1 block text-xs">Código del proveedor: {prueba.codigo}</span>
            )}
          </Alerta>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variante="suave"
            tamano="lg"
            disabled={!clave || prueba.fase === 'probando'}
            onClick={() => void probar()}
          >
            {prueba.fase === 'probando' ? 'Probando…' : 'Probar conexión'}
          </Button>
          <Button type="submit" tamano="lg" disabled={!clave || !elegido}>
            Guardar
          </Button>
        </div>
        {extra}
        {config && (
          <button
            type="button"
            onClick={() => {
              void borrar().then(onTerminar)
            }}
            className="min-h-11 text-[13px] font-bold text-exceso"
          >
            Quitar la clave de este navegador
          </button>
        )}
      </div>
    </form>
  )
}
