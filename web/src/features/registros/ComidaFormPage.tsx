import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { PantallaFlujo } from '../../components/ui/PantallaFlujo'
import { repositorios } from '../../data'
import { claveDia, esClaveDia } from '../../domain/fechas'
import {
  LIMITES_REGISTRO,
  TIPOS_COMIDA,
  TIPOS_CON_ALCOHOL,
  type Comida,
} from '../../domain/registros'
import {
  borradorDeComida,
  borradorVacio,
  tiposDeComida as tipos,
  validarComida,
  type BorradorComida,
  type ErroresComida as Errores,
} from './comidaBorrador'
import { FotoDeComida } from './FotoDeComida'

const claseCampo =
  'h-[50px] w-full min-w-0 rounded-boton border bg-crema-suave px-3.5 text-[15px] font-medium text-tinta focus:border-llama focus:bg-white'

interface CamposProps {
  borrador: BorradorComida
  errores: Errores
  onCambio: (cambios: Partial<BorradorComida>) => void
}

/** Campos de una comida; los comparten el alta manual y la revisión del análisis con IA. */
export function CamposComida({ borrador, errores, onCambio }: CamposProps) {
  const campo = (
    clave: 'porcion' | 'kcal' | 'proteinaG' | 'carbohidratosG' | 'azucarG' | 'grasaG',
    etiqueta: string,
    unidad: string,
  ) => (
    <label className="flex flex-col gap-2 text-[13px] font-semibold">
      <span>
        {etiqueta}
        {unidad && <span className="font-medium text-tinta-3"> ({unidad})</span>}
      </span>
      <input
        type="text"
        inputMode={clave === 'porcion' ? 'text' : 'decimal'}
        maxLength={clave === 'porcion' ? LIMITES_REGISTRO.porcion : 6}
        placeholder={clave === 'porcion' ? '1 plato, 330 ml…' : '0'}
        value={borrador[clave]}
        onChange={(evento) => onCambio({ [clave]: evento.target.value })}
        aria-invalid={errores[clave] ? true : undefined}
        className={`${claseCampo} ${errores[clave] ? 'border-error' : 'border-borde'}`}
      />
      {errores[clave] && <span className="text-xs font-semibold text-error">{errores[clave]}</span>}
    </label>
  )

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
      <div className="flex flex-col gap-3.5">
      <div role="group" aria-label="Tipo de comida" className="flex flex-col gap-2">
        <div className="text-[13px] font-semibold">Tipo de comida</div>
        <div className="flex flex-wrap gap-2">
          {TIPOS_COMIDA.map((tipo) => (
            <Chip
              key={tipo}
              tono="crema"
              seleccionado={borrador.tipo === tipo}
              onClick={() =>
                onCambio({
                  tipo,
                  // La marca de alcohol solo existe en snacks y licores.
                  esAlcohol:
                    tipo === 'licor' ? true : TIPOS_CON_ALCOHOL.includes(tipo) && borrador.esAlcohol,
                  ...(TIPOS_CON_ALCOHOL.includes(tipo) ? {} : { gradosAlcohol: '' }),
                })
              }
            >
              {tipos[tipo].etiqueta}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="nombre-comida" className="text-[13px] font-semibold">
          Nombre del alimento o bebida
        </label>
        <div
          className={`flex h-[52px] items-center gap-2.5 rounded-boton border bg-crema-suave px-3.5 text-tinta-3 focus-within:border-[1.5px] focus-within:border-llama focus-within:bg-white focus-within:text-kalo ${
            errores.nombre ? 'border-error' : 'border-borde'
          }`}
        >
          <Icon nombre="cubiertos" tamano={20} className="shrink-0" />
          <input
            id="nombre-comida"
            type="text"
            maxLength={LIMITES_REGISTRO.nombre}
            placeholder="Arroz con pollo, café con leche…"
            value={borrador.nombre}
            onChange={(evento) => onCambio({ nombre: evento.target.value })}
            aria-invalid={errores.nombre ? true : undefined}
            aria-describedby={errores.nombre ? 'nombre-comida-error' : undefined}
            className="min-w-0 grow border-0 bg-transparent text-[15px] font-medium text-tinta outline-none"
          />
        </div>
        {errores.nombre && (
          <p id="nombre-comida-error" className="text-xs font-semibold text-error">
            {errores.nombre}
          </p>
        )}
      </div>

      {campo('porcion', 'Porción', '')}
      </div>

      <div className="grid grid-cols-2 content-start gap-2.5">
        <div className="col-span-2">{campo('kcal', 'Calorías', 'kcal')}</div>
        {campo('proteinaG', 'Proteína', 'g')}
        {campo('carbohidratosG', 'Carbohidratos', 'g')}
        {campo('azucarG', 'Azúcar', 'g')}
        {campo('grasaG', 'Grasa', 'g')}
      </div>

      {TIPOS_CON_ALCOHOL.includes(borrador.tipo) && (
      <div className="flex flex-col gap-3.5 sm:col-span-2">
      <div className="flex items-center gap-3 rounded-2xl bg-crema px-3.5 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-kalo">
          <Icon nombre="copa" tamano={18} />
        </span>
        <div className="grow">
          <div className="text-sm font-bold">Es una bebida con alcohol</div>
          <div className="text-xs font-medium text-tinta-3">Se registra como licor en tu resumen</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={borrador.esAlcohol}
          aria-label="Es una bebida con alcohol"
          onClick={() => onCambio({ esAlcohol: !borrador.esAlcohol })}
          className="-my-2 flex h-11 w-[50px] shrink-0 items-center"
        >
          <span
            className={`flex h-[30px] w-[50px] rounded-full p-[3px] ${
              borrador.esAlcohol ? 'justify-end bg-kalo' : 'justify-start bg-borde-fuerte'
            }`}
          >
            <span className="size-6 rounded-full bg-white" />
          </span>
        </button>
      </div>

      {borrador.esAlcohol && (
        <label className="flex items-center justify-between gap-2.5 text-[13px] font-semibold">
          Grados de alcohol (% vol)
          <input
            type="text"
            inputMode="decimal"
            maxLength={5}
            placeholder="5,5"
            value={borrador.gradosAlcohol}
            onChange={(evento) => onCambio({ gradosAlcohol: evento.target.value })}
            aria-invalid={errores.gradosAlcohol ? true : undefined}
            className={`h-11 w-[110px] rounded-boton-sm border bg-crema-suave px-3 text-right text-sm font-medium ${
              errores.gradosAlcohol ? 'border-error' : 'border-borde'
            }`}
          />
        </label>
      )}
      </div>
      )}
    </div>
  )
}

type Carga = { fase: 'cargando' } | { fase: 'no-existe' } | { fase: 'lista'; comida: Comida | null }

/** Alta manual de una comida, o edición de una ya registrada (design/Manual.dc.html). */
export function ComidaFormPage() {
  const { id } = useParams()
  const [parametros] = useSearchParams()
  const navegar = useNavigate()
  useTitulo(id ? 'Editar comida' : 'Agregar manualmente')

  const tipoPedido = TIPOS_COMIDA.find((tipo) => tipo === parametros.get('tipo')) ?? 'desayuno'
  const fechaPedida = parametros.get('fecha') ?? ''

  const [carga, setCarga] = useState<Carga>(id ? { fase: 'cargando' } : { fase: 'lista', comida: null })
  // El asistente puede traer una comida sugerida ya rellenada.
  const sugerida = (useLocation().state as { prefill?: BorradorComida } | null)?.prefill
  const [borrador, setBorrador] = useState(() => sugerida ?? borradorVacio(tipoPedido))
  const [errores, setErrores] = useState<Errores>({})
  const [ocupado, setOcupado] = useState(false)
  const [fallo, setFallo] = useState(false)
  const [fotoQuitada, setFotoQuitada] = useState(false)
  const [hoy] = useState(() => claveDia(new Date()))

  useEffect(() => {
    if (!id) return
    let vigente = true
    repositorios.registros
      .obtenerComida(id)
      .then((comida) => {
        if (!vigente) return
        if (!comida) return setCarga({ fase: 'no-existe' })
        setBorrador(borradorDeComida(comida))
        setCarga({ fase: 'lista', comida })
      })
      .catch(() => {
        if (vigente) setCarga({ fase: 'no-existe' })
      })
    return () => {
      vigente = false
    }
  }, [id])

  const existente = carga.fase === 'lista' ? carga.comida : null
  const fecha = existente?.fecha ?? (esClaveDia(fechaPedida) ? fechaPedida : hoy)
  const volver = `${rutas.registros}?fecha=${fecha}`

  async function ejecutar(operacion: () => Promise<unknown>) {
    setOcupado(true)
    setFallo(false)
    try {
      await operacion()
      void navegar(volver)
    } catch {
      setFallo(true)
      setOcupado(false)
    }
  }

  function guardar(evento: FormEvent) {
    evento.preventDefault()
    if (ocupado) return
    const resultado = validarComida(borrador, fecha, existente?.origen ?? 'manual')
    if ('errores' in resultado) return setErrores(resultado.errores)
    setErrores({})
    void ejecutar(() =>
      existente
        ? repositorios.registros.actualizarComida(existente.id, resultado.comida)
        : repositorios.registros.agregarComida(resultado.comida),
    )
  }

  if (carga.fase !== 'lista') {
    return (
      <PantallaFlujo titulo="Editar comida" volver={rutas.registros}>
        {carga.fase === 'cargando' ? (
          <p role="status" className="py-10 text-center text-sm font-medium text-tinta-3">
            Cargando…
          </p>
        ) : (
          <p role="alert" className="py-10 text-center text-sm font-semibold text-error">
            No encontramos esa comida.
          </p>
        )}
      </PantallaFlujo>
    )
  }

  return (
    <PantallaFlujo titulo={existente ? 'Editar comida' : 'Agregar manualmente'} volver={volver} ancha>
      <form noValidate onSubmit={guardar} className="flex grow flex-col gap-3.5">
        {existente?.tieneFoto && !fotoQuitada && (
          <FotoDeComida id={existente.id} onQuitada={() => setFotoQuitada(true)} />
        )}
        <CamposComida
          borrador={borrador}
          errores={errores}
          onCambio={(cambios) => setBorrador((actual) => ({ ...actual, ...cambios }))}
        />

        {!existente && (
          <Link
            to={`${rutas.camara}?tipo=${borrador.tipo}&fecha=${fecha}`}
            className="flex items-center gap-3 rounded-2xl border border-borde px-3.5 py-3 text-tinta no-underline"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-crema text-kalo">
              <Icon nombre="destello" tamano={18} grosor={2} />
            </span>
            <span className="grow">
              <span className="block text-sm font-bold">¿No tienes los datos?</span>
              <span className="block text-xs font-medium text-tinta-3">
                Toma una foto y la IA los completa
              </span>
            </span>
            <Icon nombre="flechaAdelante" tamano={18} grosor={2} className="text-tinta-3" />
          </Link>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
          {fallo && (
            <p
              role="alert"
              className="rounded-boton bg-error-fondo px-3.5 py-3 text-[13px] font-semibold text-error"
            >
              No pudimos guardar el cambio. Inténtalo de nuevo.
            </p>
          )}
          <Button type="submit" tamano="xl" disabled={ocupado} className="gap-2 text-[15px]">
            <Icon nombre="check" tamano={18} grosor={2.4} />
            Guardar en {tipos[borrador.tipo].destino}
          </Button>
          {existente && (
            <Button
              variante="suave"
              tamano="lg"
              disabled={ocupado}
              onClick={() => void ejecutar(() => repositorios.registros.eliminarComida(existente.id))}
              className="gap-2"
            >
              <Icon nombre="papelera" tamano={18} />
              Eliminar
            </Button>
          )}
        </div>
      </form>
    </PantallaFlujo>
  )
}
