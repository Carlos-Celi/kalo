import { z } from 'zod'
import { formatoDecimal, formatoDuracion, formatoEntero } from './formato'
import type { Plan } from './perfil'
import { REFERENCIA_AZUCAR_G, REFERENCIA_GRASA_G } from './progreso'
import type { TotalesDia } from './registros'

export const PROVEEDORES = ['anthropic', 'openai', 'google'] as const
export type Proveedor = (typeof PROVEEDORES)[number]

export interface DatosProveedor {
  nombre: string
  familia: string
  inicial: string
  /** Forma de la clave, como pista en el campo. */
  ejemploClave: string
  /** Página del proveedor donde se crea la API key. */
  urlClaves: string
  /** Modelo que se propone al conectar por primera vez. */
  modeloPorDefecto: string
}

export const proveedores: Record<Proveedor, DatosProveedor> = {
  anthropic: {
    nombre: 'Anthropic',
    familia: 'Claude',
    inicial: 'A',
    ejemploClave: 'sk-ant-…',
    urlClaves: 'https://console.anthropic.com/settings/keys',
    modeloPorDefecto: 'claude-opus-5-5',
  },
  openai: {
    nombre: 'OpenAI',
    familia: 'GPT',
    inicial: 'O',
    ejemploClave: 'sk-…',
    urlClaves: 'https://platform.openai.com/api-keys',
    modeloPorDefecto: 'gpt-4o',
  },
  google: {
    nombre: 'Google',
    familia: 'Gemini',
    inicial: 'G',
    ejemploClave: 'AIza…',
    urlClaves: 'https://aistudio.google.com/apikey',
    modeloPorDefecto: 'gemini-2.5-flash',
  },
}

export interface ModeloIA {
  id: string
  nombre: string
}

/** Proveedor y modelo elegidos. La API key se guarda aparte, cifrada (features/ia/boveda.ts). */
export interface ConfigIA {
  proveedor: Proveedor
  modelo: string
  nombreModelo: string
  /** true cuando la última prueba de conexión con esta clave salió bien. */
  verificada: boolean
}

export const LIMITE_API_KEY = 300

export function leerConfigIA(guardado: unknown): ConfigIA | null {
  if (typeof guardado !== 'object' || guardado === null) return null
  const { proveedor, modelo, nombreModelo, verificada } = guardado as Record<string, unknown>
  const valido = PROVEEDORES.find((otro) => otro === proveedor)
  if (!valido || typeof modelo !== 'string' || modelo.length === 0 || modelo.length > 120) return null
  return {
    proveedor: valido,
    modelo,
    nombreModelo: typeof nombreModelo === 'string' && nombreModelo ? nombreModelo.slice(0, 120) : modelo,
    verificada: verificada === true,
  }
}

/** Por qué falló una llamada a la IA, sin el mensaje del proveedor. */
export type MotivoFalloIA = 'clave' | 'limite' | 'modelo' | 'rechazo' | 'red' | 'respuesta' | 'desconocido'

export class ErrorIA extends Error {
  readonly motivo: MotivoFalloIA
  /** Código técnico del proveedor ("HTTP 400 · API_KEY_INVALID"), para diagnosticar. Nunca su mensaje. */
  readonly codigo: string | null

  constructor(motivo: MotivoFalloIA, codigo: string | null = null) {
    super(motivo)
    this.name = 'ErrorIA'
    this.motivo = motivo
    this.codigo = codigo
  }
}

export const mensajeDeFalloIA: Record<MotivoFalloIA, string> = {
  clave: 'Tu proveedor rechazó la API key. Revísala en la configuración de IA.',
  limite: 'Tu proveedor limitó las peticiones o no hay saldo en tu cuenta. Inténtalo más tarde.',
  modelo: 'El modelo elegido no está disponible o no admite esta función. Elige otro en la configuración de IA.',
  rechazo: 'La IA no pudo responder a esa petición. Prueba con otra.',
  red: 'No pudimos conectar con tu proveedor de IA. Revisa tu conexión.',
  respuesta: 'La IA devolvió una respuesta que no pudimos interpretar. Inténtalo de nuevo.',
  desconocido: 'No pudimos completar la petición a la IA. Inténtalo de nuevo.',
}

/** Motivo a partir del código HTTP del proveedor. */
export function motivoDeEstado(estado: number): MotivoFalloIA {
  if (estado === 401 || estado === 403) return 'clave'
  if (estado === 429 || estado === 402) return 'limite'
  if (estado === 404 || estado === 400) return 'modelo'
  return 'desconocido'
}

// ------------------------------------------------------------- Foto de comida

/**
 * Lo que la IA estima a partir de la foto. El esquema no lleva límites para
 * que sirva como formato de salida estructurada; los valores se acotan al leerlos.
 */
export const esquemaAnalisis = z.object({
  nombre: z.string(),
  porcion: z.string(),
  /** Cuántas unidades individuales hay en la foto (2 panes → 2). */
  cantidad: z.number(),
  /** Cómo se llama una unidad, en singular ("pan con huevo"). */
  unidad: z.string(),
  /** De aquí en adelante: el total de todas las unidades que se ven. */
  kcal: z.number(),
  kcal_minimo: z.number(),
  kcal_maximo: z.number(),
  proteina_g: z.number(),
  carbohidratos_g: z.number(),
  azucar_g: z.number(),
  grasa_g: z.number(),
  confianza: z.number(),
  ingredientes: z.array(z.string()),
  es_alcohol: z.boolean(),
  grados_alcohol: z.number().nullable(),
})

export type AnalisisComida = z.infer<typeof esquemaAnalisis>

/** Unidades que se admiten en una sola foto. */
export const MAXIMO_UNIDADES = 50

/** Unidades en pasos de media (0,5 · 1 · 1,5…); lo ausente o absurdo cuenta como 1. */
function unidades(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0.5) return 1
  return Math.min(Math.round(valor * 2) / 2, MAXIMO_UNIDADES)
}

const acotar = (valor: number, maximo: number) =>
  Number.isFinite(valor) ? Math.min(Math.max(valor, 0), maximo) : 0
const unDecimal = (valor: number) => Math.round(acotar(valor, 999) * 10) / 10

/** Deja la estimación dentro de los límites que admite un registro de comida. */
export function normalizarAnalisis(crudo: AnalisisComida): AnalisisComida {
  const kcal = Math.round(acotar(crudo.kcal, 5000))
  return {
    nombre: crudo.nombre.trim().slice(0, 80) || 'Comida',
    porcion: crudo.porcion.trim().slice(0, 40),
    cantidad: unidades(crudo.cantidad),
    unidad: crudo.unidad.trim().slice(0, 40),
    kcal,
    kcal_minimo: Math.min(Math.round(acotar(crudo.kcal_minimo, 5000)), kcal),
    kcal_maximo: Math.max(Math.round(acotar(crudo.kcal_maximo, 5000)), kcal),
    proteina_g: unDecimal(crudo.proteina_g),
    carbohidratos_g: unDecimal(crudo.carbohidratos_g),
    azucar_g: unDecimal(crudo.azucar_g),
    grasa_g: unDecimal(crudo.grasa_g),
    confianza: Math.round(acotar(crudo.confianza, 100)),
    ingredientes: crudo.ingredientes
      .map((ingrediente) => ingrediente.trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 12),
    es_alcohol: crudo.es_alcohol,
    grados_alcohol:
      crudo.es_alcohol && crudo.grados_alcohol !== null
        ? Math.round(acotar(crudo.grados_alcohol, 100) * 10) / 10
        : null,
  }
}

export const PROMPT_ANALISIS = `Eres un nutriólogo que estima el contenido nutricional de una comida a partir de una foto.

Identifica el plato o la bebida y estima la porción que se ve. Antes de estimar, CUENTA con cuidado cuántas unidades individuales hay en la foto (2 panes con huevo son 2 unidades, no 1; 3 tacos son 3; un plato servido es 1). Estima los valores de UNA unidad y multiplícalos por la cantidad: todos los valores nutricionales que devuelves son del TOTAL de lo que se ve, nunca de una sola unidad. Devuelve:
- nombre: nombre corto del plato en español, en singular y sin la cantidad (por ejemplo, "Pan con huevo", "Arroz con pollo y ensalada").
- porcion: lo que ves, en pocas palabras ("2 panes", "1 plato", "330 ml").
- cantidad: cuántas unidades individuales cuentas (entero, mínimo 1).
- unidad: cómo se llama UNA unidad, en singular ("pan con huevo", "taco", "plato").
- kcal: tu mejor estimación de las calorías totales de todas las unidades, y kcal_minimo y kcal_maximo como rango razonable.
- proteina_g, carbohidratos_g, azucar_g y grasa_g: gramos totales estimados de todas las unidades.
- confianza: de 0 a 100, qué tan seguro estás de la estimación.
- ingredientes: los ingredientes principales que distingues, en español.
- es_alcohol: true solo si es una bebida alcohólica; en ese caso, grados_alcohol con su graduación típica en % vol. Si no, null.

Si la imagen no muestra comida ni bebida, usa nombre "No se reconoce comida", ceros en los números, confianza 0 y sin ingredientes.`

/** JSON Schema equivalente, para los proveedores que lo piden en ese formato. */
export const esquemaAnalisisJson = {
  type: 'object',
  properties: {
    nombre: { type: 'string' },
    porcion: { type: 'string' },
    cantidad: { type: 'number' },
    unidad: { type: 'string' },
    kcal: { type: 'number' },
    kcal_minimo: { type: 'number' },
    kcal_maximo: { type: 'number' },
    proteina_g: { type: 'number' },
    carbohidratos_g: { type: 'number' },
    azucar_g: { type: 'number' },
    grasa_g: { type: 'number' },
    confianza: { type: 'number' },
    ingredientes: { type: 'array', items: { type: 'string' } },
    es_alcohol: { type: 'boolean' },
    grados_alcohol: { type: ['number', 'null'] },
  },
  required: [
    'nombre', 'porcion', 'cantidad', 'unidad', 'kcal', 'kcal_minimo', 'kcal_maximo', 'proteina_g', 'carbohidratos_g',
    'azucar_g', 'grasa_g', 'confianza', 'ingredientes', 'es_alcohol', 'grados_alcohol',
  ],
  additionalProperties: false,
} as const

/**
 * Reescala la estimación a otra cantidad de unidades. Si la IA contó 2 panes
 * con 300 kcal, pasar a 3 deja 450: cada unidad vale lo mismo que antes.
 */
export function escalarAnalisis(analisis: AnalisisComida, cantidad: number): AnalisisComida {
  const nueva = Math.max(0.5, Math.min(Math.round(cantidad * 2) / 2, MAXIMO_UNIDADES))
  const razon = nueva / Math.max(analisis.cantidad, 0.5)
  return normalizarAnalisis({
    ...analisis,
    cantidad: nueva,
    kcal: analisis.kcal * razon,
    kcal_minimo: analisis.kcal_minimo * razon,
    kcal_maximo: analisis.kcal_maximo * razon,
    proteina_g: analisis.proteina_g * razon,
    carbohidratos_g: analisis.carbohidratos_g * razon,
    azucar_g: analisis.azucar_g * razon,
    grasa_g: analisis.grasa_g * razon,
  })
}

/** Interpreta el JSON que devuelve un proveedor; lanza ErrorIA si no cumple el esquema. */
export function leerAnalisis(texto: string): AnalisisComida {
  try {
    return normalizarAnalisis(esquemaAnalisis.parse(JSON.parse(texto)))
  } catch {
    throw new ErrorIA('respuesta')
  }
}

export type Nivel = 'Bajo' | 'Medio' | 'Alto'

/** Nivel de azúcar o grasa de un plato frente a la referencia diaria. */
export function nivelDe(gramosPlato: number, referencia: number): Nivel {
  const razon = gramosPlato / referencia
  if (razon < 0.2) return 'Bajo'
  return razon < 0.4 ? 'Medio' : 'Alto'
}

export const referencias = { azucarG: REFERENCIA_AZUCAR_G, grasaG: REFERENCIA_GRASA_G }

// ------------------------------------------------------------------ Asistente

export interface SugerenciaComida {
  nombre: string
  kcal: number
  proteina_g: number
  carbohidratos_g: number
  azucar_g: number
  grasa_g: number
}

const esquemaSugerencias = z
  .array(
    z.object({
      nombre: z.string().min(1).max(80),
      kcal: z.number().min(0).max(5000),
      proteina_g: z.number().min(0).max(999),
      carbohidratos_g: z.number().min(0).max(999).default(0),
      azucar_g: z.number().min(0).max(999).default(0),
      grasa_g: z.number().min(0).max(999).default(0),
    }),
  )
  .max(6)

export interface MensajeChat {
  rol: 'usuario' | 'asistente'
  /** Texto completo, tal como se envía al proveedor. */
  texto: string
}

const MARCA_SUGERENCIAS = '```kalo-comidas'

/**
 * Separa lo que se muestra de las comidas sugeridas, que el modelo añade al
 * final en un bloque propio. Mientras la respuesta llega a trozos, el bloque
 * incompleto se oculta.
 */
export function partirRespuesta(texto: string): { visible: string; sugerencias: SugerenciaComida[] } {
  const inicio = texto.indexOf(MARCA_SUGERENCIAS)
  if (inicio === -1) {
    // Oculta también el comienzo de la marca cuando aún está llegando.
    const cola = texto.lastIndexOf('```')
    const parcial = cola !== -1 && MARCA_SUGERENCIAS.startsWith(texto.slice(cola))
    return { visible: (parcial ? texto.slice(0, cola) : texto).trimEnd(), sugerencias: [] }
  }
  const visible = texto.slice(0, inicio).trimEnd()
  const cuerpo = texto.slice(inicio + MARCA_SUGERENCIAS.length)
  const fin = cuerpo.indexOf('```')
  if (fin === -1) return { visible, sugerencias: [] }
  try {
    return { visible, sugerencias: esquemaSugerencias.parse(JSON.parse(cuerpo.slice(0, fin))) }
  } catch {
    return { visible, sugerencias: [] }
  }
}

export const SUGERENCIAS_DE_CONSULTA = [
  'Arma mi menú de mañana',
  '¿Cómo voy esta semana?',
  'Ideas altas en proteína',
  'Lista de compras semanal',
  '¿Cómo reduzco el azúcar?',
  'Snack antes de dormir',
]

export const AVISO_MEDICO =
  'Orientación general sobre alimentación. No reemplaza a un profesional de la salud.'

const objetivos = {
  bajar: 'bajar de peso',
  mantener: 'mantener su peso',
  musculo: 'ganar masa muscular',
  sano: 'comer más sano',
}

const actividades = {
  sedentario: 'sedentario',
  ligero: 'actividad ligera (1–2 días por semana)',
  moderado: 'actividad moderada (3–4 días por semana)',
  intenso: 'actividad intensa (5 o más días por semana)',
}

const restricciones = {
  vegetariano: 'vegetariano',
  'sin-lactosa': 'sin lactosa',
  'sin-gluten': 'sin gluten',
  diabetes: 'diabetes',
  hipertension: 'hipertensión',
}

/**
 * Instrucciones del asistente, con el estado actual de la app al final. Se
 * recompone en cada consulta: así lee siempre lo que hay registrado ahora y el
 * historial del chat no arrastra datos viejos.
 */
export function promptDelAsistente({ datos, metas }: Plan, contextoDeLaApp: string): string {
  const condiciones = datos.restricciones.map((restriccion) => restricciones[restriccion])
  return `Eres el asistente de Kalo, una app de nutrición y hábitos. Eres a la vez nutriólogo, coach de hábitos y guía de la app, y hablas en español de forma cercana y práctica.

Sobre la persona:
- Nombre: ${datos.nombre}. Edad: ${datos.edad} años. Sexo: ${datos.sexo === 'sin-especificar' ? 'no especificado' : datos.sexo}. Estatura: ${datos.estaturaCm} cm. Peso al registrarse: ${formatoDecimal(datos.pesoKg)} kg.
- Objetivo principal: ${objetivos[datos.objetivo]}. Peso meta: ${formatoDecimal(datos.pesoMetaKg)} kg.
- Actividad: ${actividades[datos.actividad]}. Alcohol: ${datos.alcohol === 'nunca' ? 'nunca' : datos.alcohol === 'fines-de-semana' ? 'fines de semana' : 'varias veces por semana'}.
- Restricciones o condiciones declaradas: ${condiciones.length > 0 ? condiciones.join(', ') : 'ninguna'}.
- Metas diarias: ${formatoEntero(metas.kcal)} kcal y ${formatoEntero(metas.proteinaG)} g de proteína (las dos principales), ${formatoDecimal(metas.aguaL, 2)} L de agua, ${formatoEntero(metas.ejercicioMin)} min de ejercicio y ${formatoDuracion(metas.suenoMin)} de sueño.

Qué puedes hacer:
- Lees todo lo que la persona ha registrado en Kalo (al final de estas instrucciones): comidas con sus macros, agua, ejercicio, sueño y siestas, peso, metas y recordatorios. Úsalo siempre: cita cifras reales ("hoy llevas 52 g de proteína, te faltan 88") en lugar de consejos genéricos, y di de qué día o dato hablas.
- Si te falta un dato para responder bien, dilo y pide que lo registre; no inventes valores que no estén en los datos.
- Diseñas planes y menús (por día o por semana), recetas con cantidades, listas de la compra, sustituciones, ideas para completar la proteína o las calorías que faltan hoy, formas de reducir azúcar, grasa o alcohol, y estrategias de hidratación, ejercicio y sueño. Analizas tendencias del historial y explicas por qué.
- Explicas cómo usar Kalo cuando lo pregunten: Registros (comida, agua, ejercicio, sueño), el botón + para el registro rápido, Progreso para las gráficas, Recordatorios y Configuración para metas, perfil e IA. No puedes modificar registros tú mismo: para anotar una comida propones tarjetas con un botón "Registrar".

Cómo responder:
- Sé completo y concreto. Para preguntas simples, responde en pocas líneas; para planes, análisis o recetas, desarróllalos por completo con porciones, gramos, calorías y proteína aproximadas por comida y el total frente a la meta. No te limites en extensión cuando el tema lo pide.
- Estructura con Markdown: títulos cortos, listas, negritas para lo clave y tablas simples cuando comparen opciones o días. Cierra con el siguiente paso concreto cuando ayude.
- Ajusta todo a las metas y restricciones de la persona. Si propones alimentos, respeta las restricciones declaradas.
- Das orientación general sobre alimentación y hábitos; no diagnosticas ni sustituyes a un profesional de la salud. Ante síntomas, enfermedades, embarazo, trastornos alimentarios o medicación, recomienda consultar a un profesional. No propongas dietas extremas ni ayunos prolongados.
- Si la pregunta no tiene que ver con alimentación, hábitos o el uso de Kalo, dilo con amabilidad y vuelve al tema.

Cuando propongas comidas concretas que la persona podría registrar, añade al final de tu respuesta, y solo entonces, un bloque con este formato exacto (hasta 6 comidas, números sin unidades, una porción razonable cada una):
${MARCA_SUGERENCIAS}
[{"nombre": "Salmón a la plancha con quinua", "kcal": 520, "proteina_g": 38, "carbohidratos_g": 40, "azucar_g": 3, "grasa_g": 22}]
\`\`\`
No menciones el bloque ni repitas su contenido en el texto: la app lo muestra como tarjetas con un botón "Registrar".

=== DATOS ACTUALES DE LA PERSONA EN KALO ===
${contextoDeLaApp}
=== FIN DE LOS DATOS ===`
}

/** Saludo inicial del asistente; se arma con los datos, sin llamar a la IA. */
export function saludoDelAsistente(nombre: string, totales: TotalesDia, { metas }: Plan): string {
  const faltanKcal = Math.max(metas.kcal - totales.kcal, 0)
  const faltanProteina = Math.max(metas.proteinaG - totales.proteinaG, 0)
  const resumen =
    totales.kcal === 0
      ? 'Aún no registras comidas hoy.'
      : `Vas en ${formatoEntero(totales.kcal)} kcal y ${formatoEntero(totales.proteinaG)} g de proteína. ${
          faltanKcal > 0 || faltanProteina > 0
            ? `Te faltan ${formatoEntero(faltanKcal)} kcal y ${formatoEntero(faltanProteina)} g de proteína.`
            : 'Ya llegaste a tus dos metas principales.'
        }`
  return `Hola${nombre ? ` ${nombre}` : ''}, soy tu asistente nutricional. ${resumen} ¿En qué te ayudo?`
}
