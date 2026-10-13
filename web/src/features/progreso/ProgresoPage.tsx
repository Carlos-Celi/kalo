import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { ErrorCarga } from '../../components/ui/ErrorCarga'
import { LineaPeso } from '../../components/ui/LineaPeso'
import { repositorios } from '../../data'
import { claveDia, sumarDias } from '../../domain/fechas'
import { formatoDecimal, formatoDuracion, formatoEntero, formatoPeso } from '../../domain/formato'
import {
  cambioDePeso,
  PERIODOS,
  periodos,
  REFERENCIA_AZUCAR_G,
  REFERENCIA_GRASA_G,
  resumirPeriodo,
  tramosDe,
  type Periodo,
  type ResumenDia,
  type Tramo,
} from '../../domain/progreso'
import type { Peso } from '../../domain/registros'
import { CALORIAS_MAXIMO } from '../../domain/reglas'
import { usePerfil } from '../perfil/contexto'

const ALTO_GRAFICA = 140

type Carga =
  | { fase: 'cargando' }
  | { fase: 'error' }
  | { fase: 'lista'; resumenes: ResumenDia[]; pesos: Peso[] }

interface GraficaProps {
  titulo: string
  etiqueta: string
  promedio: string
  tramos: Tramo[]
  valor: (tramo: Tramo) => number
  meta: number
  textoMeta: string
  unidad: string
  claseBarra: (tramo: Tramo, valor: number) => string
  nota?: string
}

/** Barras por tramo con la línea de la meta. Los datos se repiten como lista para lectores de pantalla. */
function GraficaMeta({
  titulo,
  etiqueta,
  promedio,
  tramos,
  valor,
  meta,
  textoMeta,
  unidad,
  claseBarra,
  nota,
}: GraficaProps) {
  const escala = Math.max(meta * 1.08, ...tramos.map(valor), 1)
  const columnas = { gridTemplateColumns: `repeat(${tramos.length}, minmax(0, 1fr))` }
  const separacion = tramos.length > 8 ? 'gap-1' : 'gap-2.5'
  const lineaMeta = Math.round((meta / escala) * ALTO_GRAFICA)

  return (
    <section aria-label={etiqueta} className="flex flex-col gap-3 rounded-tarjeta border border-borde p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-extrabold">{titulo}</h2>
        <span className="text-xs font-medium text-tinta-3">{promedio}</span>
      </div>
      <div
        aria-hidden="true"
        className={`relative grid h-[140px] items-end ${separacion}`}
        style={columnas}
      >
        <div
          className="absolute inset-x-0 border-t-[1.5px] border-dashed border-kalo"
          style={{ bottom: lineaMeta }}
        />
        <div
          className="absolute right-0 bg-white px-1 text-xs font-bold text-kalo-oscuro"
          style={{ bottom: lineaMeta + 2 }}
        >
          {textoMeta}
        </div>
        {tramos.map((tramo) => {
          const cantidad = valor(tramo)
          return (
            <div
              key={tramo.nombre}
              className={`rounded-md ${claseBarra(tramo, cantidad)}`}
              style={{ height: Math.round((cantidad / escala) * ALTO_GRAFICA) }}
            />
          )
        })}
      </div>
      <div
        aria-hidden="true"
        className={`grid text-center text-xs font-medium text-tinta-3 ${separacion}`}
        style={columnas}
      >
        {tramos.map((tramo, i) => (
          <span
            key={tramo.nombre}
            className={`truncate ${tramo.actual ? 'font-extrabold text-kalo' : ''} ${
              tramos.length > 8 && i % 2 === 1 ? 'invisible' : ''
            }`}
          >
            {tramo.etiqueta}
          </span>
        ))}
      </div>
      <ul className="sr-only">
        {tramos.map((tramo) => (
          <li key={tramo.nombre}>
            {tramo.nombre}: {valor(tramo) > 0 ? `${formatoEntero(valor(tramo))} ${unidad}` : 'sin registros'}
          </li>
        ))}
      </ul>
      {nota && <p className="text-xs font-medium text-tinta-2">{nota}</p>}
    </section>
  )
}

interface MiniProps {
  titulo: string
  valor: string
  tramos: Tramo[]
  cantidad: (tramo: Tramo) => number
  claseBarra: string
  claseActual: string
}

function MiniBarras({ titulo, valor, tramos, cantidad, claseBarra, claseActual }: MiniProps) {
  const maximo = Math.max(...tramos.map(cantidad), 1)
  return (
    <div className="flex flex-col gap-1.5 rounded-tarjeta border border-borde p-3.5">
      <div className="text-xs font-medium text-tinta-3">{titulo}</div>
      <div className="text-lg font-extrabold">{valor}</div>
      <div
        aria-hidden="true"
        className="grid h-8 items-end gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${tramos.length}, minmax(0, 1fr))` }}
      >
        {tramos.map((tramo) => (
          <div
            key={tramo.nombre}
            className={`rounded-[3px] ${tramo.actual ? claseActual : claseBarra}`}
            style={{ height: `${Math.round((cantidad(tramo) / maximo) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function Limite({ nombre, valor, referencia, pista, relleno }: { nombre: string; valor: number; referencia: number; pista: string; relleno: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span>{nombre}</span>
        <span className={valor > referencia ? 'text-error' : ''}>
          {formatoEntero(valor)} / {referencia} g{valor > referencia ? ' !' : ''}
        </span>
      </div>
      <div aria-hidden="true" className={`h-2 rounded-full ${pista}`}>
        <div
          className={`h-2 rounded-full ${valor > referencia ? 'bg-error' : relleno}`}
          style={{ width: `${Math.min(Math.round((valor / referencia) * 100), 100)}%` }}
        />
      </div>
    </div>
  )
}

/** Gráficas de calorías, proteína, peso y hábitos (design/Progreso.dc.html). */
export function ProgresoPage() {
  useTitulo('Progreso')
  const { perfil } = usePerfil()
  const [hoy] = useState(() => claveDia(new Date()))
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })

  useEffect(() => {
    let vigente = true
    const config = periodos[periodo]
    Promise.all([
      repositorios.registros.obtenerResumenDiario(sumarDias(hoy, -(config.dias - 1)), hoy),
      repositorios.registros.obtenerPesos(sumarDias(hoy, -config.diasDePeso)),
    ])
      .then(([resumenes, pesos]) => {
        if (vigente) setCarga({ fase: 'lista', resumenes, pesos })
      })
      .catch(() => {
        if (vigente) setCarga({ fase: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [hoy, periodo])

  const plan = perfil.plan
  if (!plan) return null
  const { metas, datos } = plan
  const config = periodos[periodo]

  const selector = (
    <>
      <h1 className="text-2xl font-extrabold tracking-[-0.5px] lg:text-[32px] lg:tracking-[-0.8px]">
        Progreso
      </h1>
      <div role="group" aria-label="Periodo" className="grid grid-cols-3 rounded-boton bg-arena p-1 lg:max-w-[420px]">
        {PERIODOS.map((otro) => (
          <button
            key={otro}
            type="button"
            aria-pressed={otro === periodo}
            onClick={() => {
              if (otro === periodo) return
              setCarga({ fase: 'cargando' })
              setPeriodo(otro)
            }}
            className={`h-11 rounded-[10px] text-[13px] font-bold ${
              otro === periodo ? 'bg-white text-kalo-oscuro' : 'text-tinta-3'
            }`}
          >
            {periodos[otro].etiqueta}
          </button>
        ))}
      </div>
    </>
  )

  if (carga.fase !== 'lista') {
    return (
      <div className="flex flex-col gap-3.5">
        {selector}
        {carga.fase === 'cargando' ? (
          <p role="status" className="py-10 text-center text-sm font-medium text-tinta-3">
            Cargando tu progreso…
          </p>
        ) : (
          <ErrorCarga mensaje="No pudimos cargar tu progreso." />
        )}
      </div>
    )
  }

  const tramos = tramosDe(periodo, carga.resumenes, hoy)
  const resumen = resumirPeriodo(periodo, carga.resumenes, hoy, metas.proteinaG)
  const pesos = carga.pesos
  const ultimoPeso = pesos.at(-1)
  const cambio = cambioDePeso(pesos)
  const sinDatos = resumen.kcalPromedio === 0 && resumen.aguaMlPromedio === 0 && resumen.suenoMinPromedio === 0

  return (
    <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
      <div className="flex flex-col gap-3.5 lg:col-span-12">{selector}</div>

      {sinDatos && (
        <p className="rounded-boton bg-crema px-3.5 py-3 text-[13px] font-semibold text-kalo-oscuro lg:col-span-12">
          Todavía no hay registros en este periodo. Empieza registrando tu próxima comida.
        </p>
      )}

      <div className="lg:col-span-6">
        <GraficaMeta
          titulo="Calorías"
          etiqueta={periodo === 'semana' ? 'Calorías por día' : 'Calorías, promedio diario'}
          promedio={`Promedio ${formatoEntero(resumen.kcalPromedio)} kcal`}
          tramos={tramos}
          valor={(tramo) => tramo.kcal}
          meta={metas.kcal}
          textoMeta={`Meta ${formatoEntero(metas.kcal)}`}
          unidad="kcal"
          claseBarra={(tramo, kcal) =>
            kcal > metas.kcal * CALORIAS_MAXIMO
              ? 'bg-ejercicio'
              : tramo.actual
                ? 'bg-kalo'
                : 'bg-barra-suave'
          }
        />
      </div>

      <div className="lg:col-span-6">
        <GraficaMeta
          titulo="Proteína"
          etiqueta={periodo === 'semana' ? 'Proteína por día' : 'Proteína, promedio diario'}
          promedio={`Promedio ${formatoEntero(resumen.proteinaPromedio)} g`}
          tramos={tramos}
          valor={(tramo) => tramo.proteinaG}
          meta={metas.proteinaG}
          textoMeta={`Meta ${formatoEntero(metas.proteinaG)} g`}
          unidad="gramos"
          claseBarra={(tramo, gramos) =>
            gramos >= metas.proteinaG ? 'bg-kalo' : tramo.actual ? 'bg-barra-suave' : 'bg-llama-suave'
          }
          nota={
            resumen.diasConComida > 0
              ? `Llegaste a tu meta ${resumen.diasConProteina} de los últimos ${resumen.diasConComida} días con registro.`
              : undefined
          }
        />
      </div>

      <section
        aria-label="Peso"
        className="flex flex-col gap-2 rounded-tarjeta border border-borde p-4 lg:col-span-6"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-extrabold">Peso</h2>
          {cambio !== null && (
            <span className="rounded-md bg-ia-fondo px-2 py-[3px] text-xs font-bold text-kalo-oscuro">
              {cambio > 0 ? '+' : cambio < 0 ? '−' : ''}
              {formatoPeso(Math.abs(cambio))} kg en {config.tramoDePeso}
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-extrabold tracking-[-0.6px] text-kalo-oscuro">
            {formatoPeso(ultimoPeso?.kg ?? datos.pesoKg)} kg
          </span>
          <span className="text-xs font-medium text-tinta-3">
            meta {formatoDecimal(datos.pesoMetaKg)} kg
          </span>
        </div>
        {pesos.length > 0 ? (
          <LineaPeso valores={pesos.map((peso) => peso.kg)} conPuntos={pesos.length <= 14} />
        ) : (
          <p className="py-4 text-xs font-medium text-tinta-3">
            Aún no has registrado tu peso en este periodo.
          </p>
        )}
        <Link
          to={rutas.peso}
          className="flex h-11 items-center justify-center rounded-boton-sm bg-peso-fondo text-[13px] font-bold text-peso-texto no-underline hover:text-peso-texto"
        >
          Registrar peso
        </Link>
      </section>

      <div className="flex flex-col gap-3.5 lg:col-span-6 lg:gap-5">
        <section aria-label="Promedios de hábitos" className="grid grid-cols-2 gap-2.5">
          <MiniBarras
            titulo="Agua promedio"
            valor={`${formatoDecimal(resumen.aguaMlPromedio / 1000)} L`}
            tramos={tramos}
            cantidad={(tramo) => tramo.aguaMl}
            claseBarra="bg-agua"
            claseActual="bg-agua-claro"
          />
          <MiniBarras
            titulo="Sueño promedio"
            valor={resumen.suenoMinPromedio > 0 ? formatoDuracion(resumen.suenoMinPromedio) : '—'}
            tramos={tramos}
            cantidad={(tramo) => tramo.suenoMin}
            claseBarra="bg-llama-suave"
            claseActual="bg-sueno"
          />
          <div className="flex flex-col gap-1 rounded-tarjeta border border-borde p-3.5">
            <div className="text-xs font-medium text-tinta-3">Ejercicio</div>
            <div className="text-lg font-extrabold">{formatoEntero(resumen.ejercicioMin)} min</div>
            <div className="text-xs font-bold text-ejercicio-fuerte">
              {formatoEntero(resumen.ejercicioKcal)} kcal quemadas
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-tarjeta border border-borde p-3.5">
            <div className="text-xs font-medium text-tinta-3">Licor</div>
            <div className="text-lg font-extrabold">
              {resumen.bebidasAlcohol === 1 ? '1 bebida' : `${formatoEntero(resumen.bebidasAlcohol)} bebidas`}
            </div>
            <div className="text-xs font-bold text-error">
              ≈ {formatoEntero(resumen.kcalAlcohol)} kcal {config.esteTramo}
            </div>
          </div>
        </section>

        <section
          aria-label="Azúcar y grasa"
          className="flex flex-col gap-3 rounded-tarjeta border border-borde p-4"
        >
          <h2 className="text-[15px] font-extrabold">Azúcar y grasa · promedio diario</h2>
          <Limite
            nombre="Azúcar"
            valor={resumen.azucarPromedio}
            referencia={REFERENCIA_AZUCAR_G}
            pista="bg-azucar-pista"
            relleno="bg-azucar"
          />
          <Limite
            nombre="Grasa"
            valor={resumen.grasaPromedio}
            referencia={REFERENCIA_GRASA_G}
            pista="bg-grasa-pista"
            relleno="bg-ejercicio"
          />
        </section>
      </div>
    </div>
  )
}
