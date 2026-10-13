import { formatoDecimal, formatoDuracion, formatoEntero } from './formato'
import { formatoHora, sumarDias, ultimosDias, type ClaveDia } from './fechas'
import type { Plan } from './perfil'
import { cambioDePeso, type ResumenDia } from './progreso'
import { descripcionDe, type Recordatorio } from './recordatorios'
import {
  avanceDe,
  estadoDe,
  totalesDelDia,
  type Comida,
  type Peso,
  type Registros,
  type TipoComida,
} from './registros'
import { imc } from './reglas'

/** Todo lo que el asistente puede leer de la app en una consulta. */
export interface DatosAsistente {
  ahora: Date
  hoy: ClaveDia
  plan: Plan
  /** Registros con detalle de los últimos días (hasta 30). */
  registros: Registros
  /** Totales por día del mismo periodo. */
  resumen: ResumenDia[]
  /** Historial de peso, en orden cronológico. */
  pesos: Peso[]
  recordatorios: Recordatorio[]
}

/** Días con el detalle de cada comida; el resto del periodo va resumido. */
const DIAS_CON_DETALLE = 7
const DIAS_EN_TABLA = 14

const nombreTipo: Record<TipoComida, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snack: 'Snack',
  licor: 'Licor',
}

const g = (valor: number) => `${formatoDecimal(valor)} g`

function lineaDeComida(comida: Comida, conFecha: boolean): string {
  const marcas = [comida.origen === 'ia' ? 'estimado por IA' : '', comida.esAlcohol ? 'licor' : '']
    .filter(Boolean)
    .join(', ')
  const detalle = [
    `${formatoEntero(comida.kcal)} kcal`,
    `P ${g(comida.proteinaG)}`,
    `C ${g(comida.carbohidratosG)}`,
    `azúcar ${g(comida.azucarG)}`,
    `grasa ${g(comida.grasaG)}`,
  ].join(' · ')
  const cuando = conFecha ? `${comida.fecha} ` : `${formatoHora(comida.creadoEn)} `
  return `- ${cuando}${nombreTipo[comida.tipo]}: ${comida.nombre}${comida.porcion ? ` (${comida.porcion})` : ''} — ${detalle}${marcas ? ` [${marcas}]` : ''}`
}

const media = (valores: number[]) =>
  valores.length === 0 ? 0 : valores.reduce((suma, valor) => suma + valor, 0) / valores.length

/**
 * Texto con el estado completo del usuario en la app, para el prompt del
 * asistente: perfil, metas, hoy al detalle, historial reciente, peso y
 * recordatorios. Está pensado para leerse, no para mostrarse.
 */
export function contextoDeLaApp(entrada: DatosAsistente): string {
  const { ahora, hoy, plan, registros, resumen, pesos, recordatorios } = entrada
  const { metas } = plan
  const lineas: string[] = []
  const nueva = (texto = '') => lineas.push(texto)

  const fechaLarga = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(ahora)
  nueva(`FECHA Y HORA ACTUALES: ${fechaLarga} (hoy es ${hoy}).`)

  // ---------------------------------------------------------------- Hoy
  const totales = totalesDelDia(registros, hoy)
  nueva()
  nueva(`HOY (${hoy})`)
  nueva(
    `- Calorías: ${formatoEntero(totales.kcal)} de ${formatoEntero(metas.kcal)} kcal (${
      totales.kcal <= metas.kcal
        ? `faltan ${formatoEntero(metas.kcal - totales.kcal)}`
        : `se pasó por ${formatoEntero(totales.kcal - metas.kcal)}`
    }).`,
  )
  nueva(
    `- Proteína: ${formatoEntero(totales.proteinaG)} de ${formatoEntero(metas.proteinaG)} g (${
      totales.proteinaG >= metas.proteinaG
        ? 'meta cumplida'
        : `faltan ${formatoEntero(metas.proteinaG - totales.proteinaG)} g`
    }).`,
  )
  nueva(`- Agua: ${formatoDecimal(totales.aguaMl / 1000, 2)} de ${formatoDecimal(metas.aguaL, 2)} L.`)
  nueva(
    `- Ejercicio: ${formatoEntero(totales.ejercicioMin)} de ${formatoEntero(metas.ejercicioMin)} min (${formatoEntero(totales.ejercicioKcal)} kcal quemadas).`,
  )
  nueva(
    totales.suenoMin > 0
      ? `- Sueño: ${formatoDuracion(totales.suenoMin)} en total (noche ${formatoDuracion(totales.suenoNocheMin)}${totales.siestaMin > 0 ? `, siestas ${formatoDuracion(totales.siestaMin)}` : ''}) de una meta de ${formatoDuracion(metas.suenoMin)}.`
      : `- Sueño: sin registrar (meta ${formatoDuracion(metas.suenoMin)}).`,
  )

  const comidasHoy = registros.comidas.filter((comida) => comida.fecha === hoy)
  nueva(comidasHoy.length > 0 ? 'Comidas de hoy:' : 'Comidas de hoy: ninguna registrada todavía.')
  for (const comida of comidasHoy) nueva(lineaDeComida(comida, false))

  const aguasHoy = registros.aguas.filter((agua) => agua.fecha === hoy)
  if (aguasHoy.length > 0) {
    nueva(`Tomas de agua de hoy: ${aguasHoy.map((agua) => `${formatoHora(agua.creadoEn)} ${agua.ml} ml`).join('; ')}.`)
  }
  const ejerciciosHoy = registros.ejercicios.filter((ejercicio) => ejercicio.fecha === hoy)
  if (ejerciciosHoy.length > 0) {
    nueva(
      `Ejercicio de hoy: ${ejerciciosHoy
        .map(
          (ejercicio) =>
            `${ejercicio.nombre} ${ejercicio.minutos} min, ${ejercicio.kcal} kcal${ejercicio.origenKcal === 'manual' ? ' (medidas por el usuario)' : ' (estimadas)'}`,
        )
        .join('; ')}.`,
    )
  }

  // ----------------------------------------------------- Historial por día
  const dias = ultimosDias(hoy, DIAS_EN_TABLA)
  const porFecha = new Map(resumen.map((dia) => [dia.fecha, dia]))
  nueva()
  nueva(
    `ÚLTIMOS ${DIAS_EN_TABLA} DÍAS, uno por línea (fecha: kcal · proteína g · agua L · ejercicio min · sueño · azúcar g · grasa g · kcal de licor):`,
  )
  for (const dia of dias) {
    const fila = porFecha.get(dia)
    nueva(
      fila
        ? `- ${dia}${dia === hoy ? ' (hoy)' : ''}: ${formatoEntero(fila.kcal)} · ${formatoEntero(fila.proteinaG)} · ${formatoDecimal(fila.aguaMl / 1000, 2)} · ${formatoEntero(fila.ejercicioMin)} · ${fila.suenoMin > 0 ? formatoDuracion(fila.suenoMin) : 'sin registrar'} · ${formatoEntero(fila.azucarG)} · ${formatoEntero(fila.grasaG)} · ${formatoEntero(fila.kcalAlcohol)}`
        : `- ${dia}: sin datos`,
    )
  }

  // --------------------------------------------------------------- Medias
  const semana = ultimosDias(hoy, 7).flatMap((dia) => {
    const fila = porFecha.get(dia)
    return fila ? [fila] : []
  })
  const conComida = semana.filter((dia) => dia.kcal > 0)
  if (conComida.length > 0) {
    const cumplidosCalorias = ultimosDias(hoy, 7).filter(
      (dia) => estadoDe('comida', avanceDe('comida', totalesDelDia(registros, dia), metas)) === 'cumplido',
    ).length
    const cumplidosProteina = semana.filter((dia) => dia.proteinaG >= metas.proteinaG).length
    nueva()
    nueva(
      `PROMEDIOS DE LOS ÚLTIMOS 7 DÍAS (solo días con registro): ${formatoEntero(media(conComida.map((d) => d.kcal)))} kcal, ${formatoEntero(media(conComida.map((d) => d.proteinaG)))} g de proteína, ${formatoDecimal(media(semana.filter((d) => d.aguaMl > 0).map((d) => d.aguaMl)) / 1000, 2)} L de agua, ${formatoEntero(media(semana.map((d) => d.ejercicioMin)))} min de ejercicio al día, ${formatoDuracion(media(semana.filter((d) => d.suenoMin > 0).map((d) => d.suenoMin)))} de sueño.`,
    )
    nueva(
      `CUMPLIMIENTO EN 7 DÍAS: calorías dentro de rango ${cumplidosCalorias} días, proteína en meta ${cumplidosProteina} días, ${semana.filter((d) => d.bebidasAlcohol > 0).length} días con bebidas alcohólicas.`,
    )
  }

  // ---------------------------------------------------- Comidas recientes
  const desde = sumarDias(hoy, -(DIAS_CON_DETALLE - 1))
  const recientes = registros.comidas
    .filter((comida) => comida.fecha >= desde && comida.fecha < hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.creadoEn.localeCompare(b.creadoEn))
    .slice(-70)
  if (recientes.length > 0) {
    nueva()
    nueva(`COMIDAS REGISTRADAS EN LOS ${DIAS_CON_DETALLE - 1} DÍAS ANTERIORES (para conocer sus gustos y hábitos):`)
    for (const comida of recientes) nueva(lineaDeComida(comida, true))
  }

  // ----------------------------------------------------------------- Peso
  nueva()
  const { datos } = plan
  if (pesos.length > 0) {
    const ultimo = pesos[pesos.length - 1]
    const cambio = cambioDePeso(pesos)
    const indice = imc(ultimo.kg, datos.estaturaCm)
    nueva(
      `PESO: último registro ${formatoDecimal(ultimo.kg)} kg el ${ultimo.fecha}${indice !== null ? ` (IMC ${formatoDecimal(indice)})` : ''}; peso meta ${formatoDecimal(datos.pesoMetaKg)} kg (${
        ultimo.kg > datos.pesoMetaKg
          ? `faltan ${formatoDecimal(ultimo.kg - datos.pesoMetaKg)} kg`
          : 'meta alcanzada o superada'
      }).`,
    )
    nueva(
      `Historial de peso: ${pesos
        .slice(-12)
        .map((peso) => `${peso.fecha} ${formatoDecimal(peso.kg)} kg${peso.nota ? ` (${peso.nota})` : ''}`)
        .join('; ')}.${cambio !== null ? ` Cambio en el periodo: ${cambio > 0 ? '+' : ''}${formatoDecimal(cambio)} kg.` : ''}`,
    )
  } else {
    nueva(`PESO: sin registros. Peso declarado en el perfil: ${formatoDecimal(datos.pesoKg)} kg; meta ${formatoDecimal(datos.pesoMetaKg)} kg.`)
  }

  // -------------------------------------------------------- Recordatorios
  const activos = recordatorios.filter((recordatorio) => recordatorio.activo)
  nueva()
  nueva(
    activos.length > 0
      ? `RECORDATORIOS ACTIVOS: ${activos.map((r) => `${r.nombre} (${descripcionDe(r)})`).join('; ')}.`
      : 'RECORDATORIOS: ninguno activo.',
  )

  return lineas.join('\n')
}
