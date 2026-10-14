import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { rutaDeComida, rutas } from '../../app/rutas'
import { Alerta } from '../../components/ui/Alerta'
import { AvisoGuardado, CampoMedida } from '../../components/ui/CamposNumericos'
import { Chip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { formatoDecimal, formatoDuracion, formatoEntero, numeroDeTexto } from '../../domain/formato'
import { formatoDiaMes, formatoHora, sumarDias, type ClaveDia } from '../../domain/fechas'
import type { Metas } from '../../domain/perfil'
import {
  duracionDeSueno,
  kcalDeEjercicio,
  LIMITES_REGISTRO,
  promedio,
  totalesDelDia,
  type Comida,
  type Registros,
  type TipoComida,
} from '../../domain/registros'
import { fraccion, restante } from '../../domain/reglas'
import type { AccionesRegistros } from './useRegistros'

interface Props {
  registros: Registros
  fecha: ClaveDia
  /** Hoy, para ofrecer "anoche" y "antenoche" en el sueño. */
  hoy: ClaveDia
  esHoy: boolean
  metas: Metas
  acciones: AccionesRegistros
  /** Fechas de la semana visible, para los resúmenes semanales. */
  semana: ClaveDia[]
  onSeleccionar: (dia: ClaveDia) => void
}

function Barra({ avance, alto, pista, relleno }: { avance: number; alto: string; pista: string; relleno: string }) {
  return (
    <div aria-hidden="true" className={`${alto} rounded-full ${pista}`}>
      <div
        className={`${alto} rounded-full ${relleno}`}
        style={{ width: `${Math.round(Math.min(Math.max(avance, 0), 1) * 100)}%` }}
      />
    </div>
  )
}

function Consejo({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-boton bg-muro px-3.5 py-3 text-xs leading-normal font-medium text-ceniza">
      {children}
    </p>
  )
}

const claseDeshacer =
  'h-11 rounded-boton-sm bg-muro text-[13px] font-semibold text-ceniza disabled:opacity-50'

const porHoraDescendente = <T extends { creadoEn: string }>(lista: T[]) =>
  [...lista].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))

// ---------------------------------------------------------------- Comida

const grupos: { titulo: string; tipos: TipoComida[]; alta: TipoComida; conFoto: boolean }[] = [
  { titulo: 'Desayuno', tipos: ['desayuno'], alta: 'desayuno', conFoto: true },
  { titulo: 'Almuerzo', tipos: ['almuerzo'], alta: 'almuerzo', conFoto: true },
  { titulo: 'Cena', tipos: ['cena'], alta: 'cena', conFoto: true },
  { titulo: 'Snacks y licor', tipos: ['snack', 'licor'], alta: 'snack', conFoto: false },
]

function FilaComida({ comida }: { comida: Comida }) {
  return (
    <Link
      to={rutaDeComida(comida.id)}
      className="flex min-h-[46px] items-center gap-2 border-t border-divisor py-1 text-hueso no-underline"
    >
      <span className="flex grow flex-col">
        <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold">
          {comida.nombre}
          {comida.origen === 'ia' && (
            <span className="rounded-md bg-llama/15 px-[7px] py-px text-xs font-bold text-llama">
              IA
            </span>
          )}
          {comida.esAlcohol && (
            <span className="rounded-md bg-exceso/15 px-[7px] py-px text-xs font-bold text-exceso">
              Licor
            </span>
          )}
          {comida.tieneFoto && (
            <span className="inline-flex items-center text-ceniza">
              <Icon nombre="camara" tamano={14} />
              <span className="sr-only">Con foto</span>
            </span>
          )}
        </span>
        <span className="text-xs font-medium text-ceniza">
          {formatoDecimal(comida.proteinaG)} g proteína · {formatoDecimal(comida.azucarG)} g azúcar
        </span>
      </span>
      <span className="text-sm font-extrabold">
        {formatoEntero(comida.kcal)}
        <span className="sr-only"> kcal</span>
      </span>
    </Link>
  )
}

export function DetalleComida({ registros, fecha, metas }: Props) {
  const totales = totalesDelDia(registros, fecha)
  const calorias = { valor: totales.kcal, meta: metas.kcal }
  const proteina = { valor: totales.proteinaG, meta: metas.proteinaG }
  const delDia = registros.comidas.filter((comida) => comida.fecha === fecha)
  const exceso = calorias.valor - calorias.meta

  return (
    <div className="flex flex-col gap-2.5">
      <section aria-label="Metas principales" className="flex flex-col gap-2 rounded-tarjeta bg-banco p-3.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-bold">
            Calorías{' '}
            <span className="font-medium text-ceniza">
              {formatoEntero(calorias.valor)} / {formatoEntero(calorias.meta)} kcal
            </span>
          </span>
          <span className={`text-xs font-bold ${exceso > 0 ? 'text-exceso' : 'text-llama'}`}>
            {exceso > 0 ? `Te pasaste por ${formatoEntero(exceso)}` : `Quedan ${formatoEntero(restante(calorias))}`}
          </span>
        </div>
        <Barra avance={fraccion(calorias)} alto="h-1.5" pista="bg-filo" relleno="bg-llama" />
        <div className="flex items-baseline justify-between pt-0.5">
          <span className="text-[13px] font-bold">
            Proteína{' '}
            <span className="font-medium text-ceniza">
              {formatoEntero(proteina.valor)} / {formatoEntero(proteina.meta)} g
            </span>
          </span>
          <span className="text-xs font-bold text-llama">
            {restante(proteina) > 0 ? `Faltan ${formatoEntero(restante(proteina))} g` : 'Meta cumplida'}
          </span>
        </div>
        <Barra avance={fraccion(proteina)} alto="h-1.5" pista="bg-filo" relleno="bg-sol" />
      </section>

      {grupos.map(({ titulo, tipos, alta, conFoto }) => {
        const comidas = delDia.filter((comida) => tipos.includes(comida.tipo))
        const kcal = comidas.reduce((total, comida) => total + comida.kcal, 0)
        const destino = `${conFoto ? rutas.camara : rutas.comidaManual}?tipo=${alta}&fecha=${fecha}`
        return (
          <section key={titulo} className="rounded-2xl border border-filo px-3">
            <div className="flex min-h-[52px] items-center gap-2.5">
              <h3 className="grow text-sm font-extrabold">{titulo}</h3>
              <span className="text-xs font-semibold text-ceniza">
                {comidas.length > 0 ? `${formatoEntero(kcal)} kcal` : 'Sin registrar'}
              </span>
              <Link
                to={destino}
                aria-label={`Añadir a ${titulo}`}
                className="-my-1 flex size-11 items-center justify-center rounded-full"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brasa text-white">
                  <Icon nombre="mas" tamano={18} grosor={2.4} />
                </span>
              </Link>
            </div>
            {comidas.map((comida) => (
              <FilaComida key={comida.id} comida={comida} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

// ------------------------------------------------------------------ Agua

const ATAJOS_AGUA_ML = [250, 500, 750]

export function DetalleAgua({ registros, fecha, esHoy, metas, acciones }: Props) {
  const ml = totalesDelDia(registros, fecha).aguaMl
  const metaMl = Math.round(metas.aguaL * 1000)
  const faltan = Math.max(metaMl - ml, 0)
  const tomas = porHoraDescendente(registros.aguas.filter((agua) => agua.fecha === fecha))

  return (
    <div className="flex flex-col gap-2.5">
      <section aria-label="Agua del día" className="flex flex-col gap-2 rounded-tarjeta bg-agua-luz/10 p-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-[-1px] text-agua-luz">
            {formatoDecimal(ml / 1000)} L
          </span>
          <span className="text-[13px] font-semibold text-ceniza">
            de {formatoDecimal(metas.aguaL, 2)} L · {Math.min(Math.round((ml / metaMl) * 100), 100)} %
          </span>
        </div>
        <Barra avance={ml / metaMl} alto="h-2" pista="bg-filo" relleno="bg-agua-luz" />
        <p aria-live="polite" className="text-xs font-medium text-ceniza">
          {faltan > 0
            ? `Te faltan ${formatoEntero(faltan)} ml.`
            : esHoy
              ? '¡Meta cumplida por hoy!'
              : 'Meta cumplida ese día.'}
        </p>
      </section>
      <div role="group" aria-label="Añadir agua" className="grid grid-cols-3 gap-2">
        {ATAJOS_AGUA_ML.map((atajo) => (
          <button
            key={atajo}
            type="button"
            onClick={() => void acciones.agregarAgua(fecha, atajo)}
            className="h-12 rounded-boton bg-agua-luz/15 text-sm font-extrabold text-agua-luz"
          >
            +{atajo} ml
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={tomas.length === 0}
        onClick={() => void acciones.deshacerAgua(fecha)}
        className={claseDeshacer}
      >
        Deshacer último
      </button>
      {tomas.length > 0 && (
        <ul aria-label="Agua registrada" className="rounded-2xl border border-filo px-3.5 py-1">
          {tomas.map((toma) => (
            <li
              key={toma.id}
              className="flex min-h-11 items-center justify-between border-b border-divisor text-[13px] last:border-b-0"
            >
              <span className="font-semibold text-ceniza">{formatoHora(toma.creadoEn)}</span>
              <span className="font-extrabold">{formatoEntero(toma.ml)} ml</span>
            </li>
          ))}
        </ul>
      )}
      <Consejo>Tomar un vaso de agua antes de cada comida te ayuda a regular el hambre.</Consejo>
    </div>
  )
}

// ------------------------------------------------------------- Ejercicio

const ATAJOS_EJERCICIO_MIN = [10, 20, 30]
const ACTIVIDADES = ['Caminata', 'Correr', 'Gimnasio', 'Bicicleta', 'Natación', 'Yoga']

/** "1 h 30 min" · "45 min" · "2 h" */
function duracionCorta(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}

function FormularioEjercicio({ fecha, acciones }: Pick<Props, 'fecha' | 'acciones'>) {
  const [nombre, setNombre] = useState('')
  const [horas, setHoras] = useState('')
  const [minutos, setMinutos] = useState('')
  const [kcal, setKcal] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const duracion = (Number(horas) || 0) * 60 + (Number(minutos) || 0)
  const estimada = kcalDeEjercicio(duracion)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setGuardado(null)
    if (duracion < 1) return setError('Escribe cuánto duró: horas, minutos o ambos.')
    if (duracion > LIMITES_REGISTRO.ejercicioMin) {
      return setError(`La duración máxima es ${LIMITES_REGISTRO.ejercicioMin / 60} horas.`)
    }
    const kcalManual = kcal.trim() === '' ? null : Math.round(numeroDeTexto(kcal))
    if (kcalManual !== null && (!Number.isFinite(kcalManual) || kcalManual > LIMITES_REGISTRO.ejercicioKcal)) {
      return setError(`Las calorías van de 0 a ${formatoEntero(LIMITES_REGISTRO.ejercicioKcal)}.`)
    }
    setError(null)
    setEnviando(true)
    const limpio = nombre.trim().slice(0, LIMITES_REGISTRO.ejercicioNombre) || 'Ejercicio'
    const ok = await acciones.agregarEjercicio({ fecha, minutos: duracion, nombre: limpio, kcal: kcalManual })
    setEnviando(false)
    if (!ok) return
    setGuardado(`${limpio}: ${duracionCorta(duracion)} guardados.`)
    setNombre('')
    setHoras('')
    setMinutos('')
    setKcal('')
  }

  return (
    <form
      noValidate
      onSubmit={(evento) => void enviar(evento)}
      aria-label="Registrar ejercicio"
      className="flex flex-col gap-3.5 rounded-tarjeta border border-filo bg-muro p-4"
    >
      <div>
        <h3 className="text-[15px] font-extrabold">Registrar una sesión</h3>
        <p className="text-xs font-medium text-ceniza">
          Escribe la duración y, si tu reloj o pulsera mide las calorías, ponlas tal cual.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="ejercicio-nombre" className="text-[13px] font-bold">
          Actividad <span className="font-medium text-ceniza">(opcional)</span>
        </label>
        <input
          id="ejercicio-nombre"
          type="text"
          autoComplete="off"
          maxLength={LIMITES_REGISTRO.ejercicioNombre}
          placeholder="Caminata, pesas, fútbol…"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          className="h-[52px] rounded-boton border border-filo bg-muro px-3.5 text-[15px] font-medium text-hueso focus:border-[1.5px] focus:border-llama focus:bg-muro focus:outline-none"
        />
        <div role="group" aria-label="Actividades frecuentes" className="flex flex-wrap gap-1.5">
          {ACTIVIDADES.map((actividad) => (
            <Chip key={actividad} tono="crema" seleccionado={nombre === actividad} onClick={() => setNombre(actividad)}>
              {actividad}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <CampoMedida id="ejercicio-horas" etiqueta="Horas" unidad="h" placeholder="0" maxLength={2} valor={horas} onCambio={setHoras} />
        <CampoMedida id="ejercicio-minutos" etiqueta="Minutos" unidad="min" placeholder="0" maxLength={3} valor={minutos} onCambio={setMinutos} />
        <div className="col-span-2 sm:col-span-1">
          <CampoMedida
            id="ejercicio-kcal"
            etiqueta="Calorías quemadas"
            unidad="kcal"
            placeholder={duracion > 0 ? `≈ ${estimada}` : 'Opcional'}
            maxLength={4}
            valor={kcal}
            onCambio={setKcal}
            ayuda={kcal === '' ? 'Si lo dejas vacío, lo estimamos.' : 'Dato tuyo: se guarda como lo escribes.'}
          />
        </div>
      </div>

      {error && (
        <Alerta titulo="Revisa los datos">{error}</Alerta>
      )}
      {guardado && <AvisoGuardado>{guardado}</AvisoGuardado>}
      <button
        type="submit"
        disabled={enviando}
        className="h-[50px] rounded-boton bg-ejercicio-luz text-[15px] font-bold text-tinta hover:brightness-110 disabled:opacity-50"
      >
        {enviando ? 'Guardando…' : 'Añadir ejercicio'}
      </button>
    </form>
  )
}

export function DetalleEjercicio({ registros, fecha, esHoy, metas, acciones, semana }: Props) {
  const totales = totalesDelDia(registros, fecha)
  const faltan = Math.max(metas.ejercicioMin - totales.ejercicioMin, 0)
  const sesiones = porHoraDescendente(registros.ejercicios.filter((e) => e.fecha === fecha))
  const minutosPorDia = semana.map((dia) => totalesDelDia(registros, dia).ejercicioMin)
  const minutosSemana = minutosPorDia.reduce((total, minutos) => total + minutos, 0)
  const diasCumplidos = minutosPorDia.filter((minutos) => minutos >= metas.ejercicioMin).length

  return (
    <div className="flex flex-col gap-3">
      <section
        aria-label="Ejercicio del día"
        className="flex flex-col gap-2 rounded-tarjeta bg-ejercicio-luz/15 p-4"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold tracking-[-1px] text-ejercicio-luz">
              {formatoEntero(totales.ejercicioMin)}
            </span>
            <span className="text-[13px] font-semibold text-ceniza">
              / {formatoEntero(metas.ejercicioMin)} min
              {totales.ejercicioMin >= 60 && ` (${duracionCorta(totales.ejercicioMin)})`}
            </span>
          </span>
          <span className="text-[13px] font-bold text-ejercicio-luz">
            {formatoEntero(totales.ejercicioKcal)} kcal quemadas
          </span>
        </div>
        <Barra
          avance={metas.ejercicioMin > 0 ? totales.ejercicioMin / metas.ejercicioMin : 0}
          alto="h-2"
          pista="bg-filo"
          relleno="bg-ejercicio-luz"
        />
        <p className="text-xs font-medium text-ceniza">
          {formatoEntero(minutosSemana)} min esta semana · meta cumplida {diasCumplidos} de 7 días
        </p>
      </section>

      <div role="group" aria-label="Añadir minutos de ejercicio" className="grid grid-cols-4 gap-2">
        {ATAJOS_EJERCICIO_MIN.map((atajo) => (
          <button
            key={atajo}
            type="button"
            onClick={() =>
              void acciones.agregarEjercicio({ fecha, minutos: atajo, nombre: 'Ejercicio', kcal: null })
            }
            className="h-12 rounded-boton bg-ejercicio-luz/15 text-sm font-extrabold text-ejercicio-luz"
          >
            +{atajo} min
          </button>
        ))}
        <button
          type="button"
          disabled={sesiones.length === 0}
          onClick={() => void acciones.deshacerEjercicio(fecha)}
          className="h-12 rounded-boton bg-muro text-[13px] font-semibold text-ceniza disabled:opacity-50"
        >
          Deshacer
        </button>
      </div>

      <FormularioEjercicio fecha={fecha} acciones={acciones} />

      {sesiones.length > 0 && (
        <ul aria-label="Ejercicio registrado" className="rounded-2xl border border-filo px-3.5">
          {sesiones.map((sesion) => (
            <li
              key={sesion.id}
              className="flex min-h-[58px] items-center gap-2.5 border-b border-divisor last:border-b-0"
            >
              <span className="flex min-w-0 grow flex-col">
                <span className="truncate text-[13px] font-bold">{sesion.nombre}</span>
                <span className="text-xs font-medium text-ceniza">
                  {formatoHora(sesion.creadoEn)} · {duracionCorta(sesion.minutos)}
                </span>
              </span>
              <span className="flex flex-col items-end">
                <span className="text-sm font-extrabold">{formatoEntero(sesion.kcal)} kcal</span>
                <span className="text-xs font-medium text-ceniza">
                  {sesion.origenKcal === 'manual' ? 'Tu medición' : 'Estimado'}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Eliminar ${sesion.nombre} de las ${formatoHora(sesion.creadoEn)}`}
                onClick={() => void acciones.eliminarEjercicio(sesion.id)}
                className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-ceniza hover:text-exceso"
              >
                <Icon nombre="papelera" tamano={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p
        aria-live="polite"
        className="rounded-boton bg-muro px-3.5 py-3 text-xs leading-normal font-medium text-ceniza"
      >
        {faltan > 0
          ? `Te faltan ${formatoEntero(faltan)} min para tu meta${esHoy ? ' de hoy. Una caminata corta después de cenar te alcanza.' : ' de ese día.'}`
          : esHoy
            ? '¡Meta de ejercicio cumplida hoy!'
            : 'Meta de ejercicio cumplida ese día.'}
      </p>
    </div>
  )
}

// ----------------------------------------------------------------- Sueño

/** "6 h 45 min" */
function duracionLarga(minutos: number): string {
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`
}

/** "+0 h 30" · "−1 h 15" · "0 h 00" */
function diferencia(minutos: number): string {
  const absoluto = Math.abs(Math.round(minutos))
  const signo = minutos > 0 ? '+' : minutos < 0 ? '−' : ''
  return `${signo}${Math.floor(absoluto / 60)} h ${String(absoluto % 60).padStart(2, '0')}`
}

const ATAJOS_SIESTA_MIN = [15, 20, 30, 45, 60]

const claseHora =
  'h-[52px] rounded-boton border border-filo bg-muro px-3.5 text-[17px] font-bold text-hueso focus:border-[1.5px] focus:border-llama focus:bg-muro focus:outline-none'

function FormularioNoche({
  fecha,
  actual,
  acciones,
}: Pick<Props, 'fecha' | 'acciones'> & { actual: number }) {
  const [modo, setModo] = useState<'horario' | 'duracion'>('horario')
  const [dormir, setDormir] = useState('23:00')
  const [despertar, setDespertar] = useState('07:00')
  const [horas, setHoras] = useState(() => (actual > 0 ? String(Math.floor(actual / 60)) : ''))
  const [minutos, setMinutos] = useState(() => (actual > 0 ? String(actual % 60) : ''))
  const [error, setError] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const total =
    modo === 'horario'
      ? duracionDeSueno(dormir, despertar)
      : (Number(horas) || 0) * 60 + (Number(minutos) || 0)

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setGuardado(false)
    if (!total || total < 1) {
      return setError(
        modo === 'horario' ? 'Elige a qué hora te dormiste y a qué hora despertaste.' : 'Escribe cuánto dormiste.',
      )
    }
    if (total > LIMITES_REGISTRO.suenoMin) {
      return setError(`La noche puede durar como máximo ${LIMITES_REGISTRO.suenoMin / 60} horas.`)
    }
    setError(null)
    setEnviando(true)
    const ok = await acciones.guardarSueno(fecha, total)
    setEnviando(false)
    setGuardado(ok)
  }

  return (
    <form
      noValidate
      onSubmit={(evento) => void enviar(evento)}
      aria-label="Registrar la noche"
      className="flex flex-col gap-3.5 rounded-tarjeta border border-filo bg-muro p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-extrabold">Sueño de la noche</h3>
          <p className="text-xs font-medium text-ceniza">
            {actual > 0 ? `Registrado: ${duracionLarga(actual)}. Puedes corregirlo.` : 'Aún sin registrar.'}
          </p>
        </div>
        <div role="group" aria-label="Cómo lo anotas" className="flex gap-1.5">
          <Chip seleccionado={modo === 'horario'} onClick={() => setModo('horario')}>
            Por horario
          </Chip>
          <Chip seleccionado={modo === 'duracion'} onClick={() => setModo('duracion')}>
            Por duración
          </Chip>
        </div>
      </div>

      {modo === 'horario' ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="sueno-dormir" className="text-[13px] font-bold">
              Me dormí a las
            </label>
            <input
              id="sueno-dormir"
              type="time"
              value={dormir}
              onChange={(evento) => setDormir(evento.target.value)}
              className={claseHora}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="sueno-despertar" className="text-[13px] font-bold">
              Desperté a las
            </label>
            <input
              id="sueno-despertar"
              type="time"
              value={despertar}
              onChange={(evento) => setDespertar(evento.target.value)}
              className={claseHora}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <CampoMedida id="sueno-horas" etiqueta="Horas" unidad="h" placeholder="0" maxLength={2} valor={horas} onCambio={setHoras} />
          <CampoMedida id="sueno-minutos" etiqueta="Minutos" unidad="min" placeholder="0" maxLength={2} valor={minutos} onCambio={setMinutos} />
        </div>
      )}

      <p aria-live="polite" className="text-sm font-bold text-sueno-luz">
        {total && total > 0 ? `Dormiste ${duracionLarga(total)}` : 'Indica cuánto dormiste'}
      </p>

      {error && (
        <Alerta titulo="Revisa los datos">{error}</Alerta>
      )}
      {guardado && <AvisoGuardado>Noche guardada.</AvisoGuardado>}
      <button
        type="submit"
        disabled={enviando}
        className="h-[50px] rounded-boton bg-sueno-luz text-[15px] font-bold text-tinta hover:brightness-110 disabled:opacity-50"
      >
        {enviando ? 'Guardando…' : actual > 0 ? 'Actualizar la noche' : 'Guardar la noche'}
      </button>
    </form>
  )
}

function SeccionSiestas({ registros, fecha, acciones }: Pick<Props, 'registros' | 'fecha' | 'acciones'>) {
  const [minutos, setMinutos] = useState('')
  const [error, setError] = useState<string | null>(null)
  const siestas = porHoraDescendente(registros.siestas.filter((siesta) => siesta.fecha === fecha))

  async function anadir(valor: number) {
    if (!Number.isInteger(valor) || valor < 1 || valor > LIMITES_REGISTRO.siestaMin) {
      return setError(`Una siesta dura entre 1 y ${LIMITES_REGISTRO.siestaMin} minutos.`)
    }
    setError(null)
    if (await acciones.agregarSiesta(fecha, valor)) setMinutos('')
  }

  return (
    <section
      aria-labelledby="siestas-titulo"
      className="flex flex-col gap-3 rounded-tarjeta border border-filo bg-muro p-4"
    >
      <div>
        <h3 id="siestas-titulo" className="text-[15px] font-extrabold">
          Siestas del día
        </h3>
        <p className="text-xs font-medium text-ceniza">Se suman al sueño de la noche.</p>
      </div>
      <div role="group" aria-label="Añadir siesta" className="flex flex-wrap gap-2">
        {ATAJOS_SIESTA_MIN.map((atajo) => (
          <button
            key={atajo}
            type="button"
            onClick={() => void anadir(atajo)}
            className="h-11 rounded-full bg-sueno-luz/15 px-4 text-[13px] font-extrabold text-sueno-luz"
          >
            +{atajo} min
          </button>
        ))}
      </div>
      <form
        noValidate
        onSubmit={(evento) => {
          evento.preventDefault()
          void anadir(numeroDeTexto(minutos))
        }}
        className="flex items-end gap-2"
      >
        <div className="grow">
          <CampoMedida
            id="siesta-minutos"
            etiqueta="Otra duración"
            unidad="min"
            placeholder="Minutos"
            maxLength={3}
            valor={minutos}
            onCambio={setMinutos}
          />
        </div>
        <button
          type="submit"
          className="h-[52px] shrink-0 rounded-boton bg-sueno-luz px-4 text-[15px] font-bold text-tinta"
        >
          Añadir
        </button>
      </form>
      {error && (
        <Alerta titulo="Revisa la siesta">{error}</Alerta>
      )}
      {siestas.length > 0 && (
        <ul aria-label="Siestas registradas" className="border-t border-divisor">
          {siestas.map((siesta) => (
            <li
              key={siesta.id}
              className="flex min-h-11 items-center gap-2 border-b border-divisor text-[13px] last:border-b-0"
            >
              <span className="grow font-semibold text-ceniza">{formatoHora(siesta.creadoEn)}</span>
              <span className="font-extrabold">{duracionCorta(siesta.minutos)}</span>
              <button
                type="button"
                aria-label={`Eliminar la siesta de ${duracionCorta(siesta.minutos)}`}
                onClick={() => void acciones.eliminarSiesta(siesta.id)}
                className="-mr-2 flex size-11 items-center justify-center rounded-full text-ceniza hover:text-exceso"
              >
                <Icon nombre="papelera" tamano={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function DetalleSueno({
  registros,
  fecha,
  hoy,
  esHoy,
  metas,
  acciones,
  semana,
  onSeleccionar,
}: Props) {
  const totales = totalesDelDia(registros, fecha)
  const minutos = totales.suenoMin
  const media = Math.round(promedio(semana.map((dia) => totalesDelDia(registros, dia).suenoMin)))
  const frenteAMeta = minutos - metas.suenoMin
  const ayer = sumarDias(hoy, -1)
  const noche = `Noche del ${formatoDiaMes(sumarDias(fecha, -1))} al ${formatoDiaMes(fecha)}`

  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Noche que registras" className="flex flex-wrap gap-2">
        <Chip seleccionado={fecha === hoy} onClick={() => onSeleccionar(hoy)}>
          Anoche
        </Chip>
        <Chip seleccionado={fecha === ayer} onClick={() => onSeleccionar(ayer)}>
          Antenoche
        </Chip>
        {fecha !== hoy && fecha !== ayer && (
          <span className="flex min-h-11 items-center text-[13px] font-semibold text-ceniza">{noche}</span>
        )}
      </div>

      <section
        aria-label="Horas dormidas"
        className="flex flex-col gap-2.5 rounded-tarjeta bg-sueno-luz/15 p-4 text-sueno-luz"
      >
        <div className="text-[13px] font-semibold text-ceniza">{noche}</div>
        <div aria-live="polite" className="num-marcador text-5xl leading-none font-extrabold">
          {minutos > 0 ? duracionLarga(minutos) : 'Sin registrar'}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-ceniza">
          <span>Meta: {formatoDuracion(metas.suenoMin)}</span>
          {totales.siestaMin > 0 && (
            <span>
              Noche {formatoDuracion(totales.suenoNocheMin)} + siestas {formatoDuracion(totales.siestaMin)}
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <FormularioNoche
          // Al cambiar de noche el formulario parte de lo que haya guardado en ella.
          key={fecha}
          fecha={fecha}
          actual={totales.suenoNocheMin}
          acciones={acciones}
        />
        <SeccionSiestas registros={registros} fecha={fecha} acciones={acciones} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 rounded-2xl border border-filo p-3.5">
          <span className="text-xs font-semibold text-ceniza">Promedio semanal</span>
          <span className="text-lg font-extrabold">
            {media > 0 ? diferencia(media).replace('+', '') : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl border border-filo p-3.5">
          <span className="text-xs font-semibold text-ceniza">Frente a tu meta</span>
          <span className={`text-lg font-extrabold ${minutos > 0 && frenteAMeta < 0 ? 'text-exceso' : ''}`}>
            {minutos > 0 ? diferencia(frenteAMeta) : '—'}
          </span>
        </div>
      </div>
      <Consejo>
        {esHoy && minutos > 0 && minutos < 420
          ? 'Dormir menos de 7 horas puede aumentar el hambre. Hoy intenta acostarte más temprano.'
          : 'Dormir bien ayuda a regular el hambre y a recuperarte del ejercicio.'}
      </Consejo>
    </div>
  )
}
