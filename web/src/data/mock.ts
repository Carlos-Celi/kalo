import { claveDia, sumarDias, ultimosDias, type ClaveDia } from '../domain/fechas'
import type { Perfil, Plan } from '../domain/perfil'
import type { ResumenDia } from '../domain/progreso'
import {
  kcalDeEjercicio,
  totalesDelDia,
  type Agua,
  type Comida,
  type Ejercicio,
  type NuevaComida,
  type Peso,
  type Registros,
  type Siesta,
  type Sueno,
} from '../domain/registros'
import type { Repositorios } from './repositorios'

/** El perfil de ejemplo del diseño del onboarding, ya completado. */
export function perfilDeEjemplo(): Perfil {
  return {
    nombre: 'Carlos',
    plan: {
      datos: {
        nombre: 'Carlos',
        edad: 30,
        sexo: 'masculino',
        estaturaCm: 172,
        pesoKg: 78,
        objetivo: 'bajar',
        pesoMetaKg: 72,
        actividad: 'ligero',
        suenoHabitual: '5-7',
        alcohol: 'fines-de-semana',
        restricciones: ['sin-lactosa'],
      },
      metas: { kcal: 1850, proteinaG: 140, aguaL: 2.5, ejercicioMin: 60, suenoMin: 480 },
    },
  }
}

// Datos de ejemplo del diseño (Inicio, Registros, Peso). Los seis días
// anteriores a hoy, del más antiguo al más reciente.
const KCAL_PREVIAS = [1620, 1780, 1540, 1960, 1700, 1490]
const PROTEINA_PREVIA = [118, 132, 96, 140, 125, 104]
const AGUA_ML_PREVIA = [2500, 2200, 1800, 2600, 2000, 2500]
const EJERCICIO_MIN_PREVIO = [60, 45, 0, 70, 30, 60]
const SUENO_MIN_PREVIO = [390, 420, 348, 372, 510, 498]
const PESOS_SEMANALES = [80.2, 79.8, 79.4, 79.2, 78.6, 78]

let siguienteId = 1
const nuevoId = () => `mock-${siguienteId++}`

function instante(fecha: ClaveDia, hora: string): string {
  const momento = new Date(`${fecha}T${hora}:00`)
  // Los ejemplos de hoy nunca quedan en el futuro: lo que se registre después va detrás.
  if (momento.getTime() > Date.now()) momento.setDate(momento.getDate() - 1)
  return momento.toISOString()
}

function comida(fecha: ClaveDia, hora: string, datos: Partial<NuevaComida> & Pick<NuevaComida, 'tipo' | 'nombre' | 'kcal'>): Comida {
  return {
    porcion: '',
    proteinaG: 0,
    carbohidratosG: 0,
    azucarG: 0,
    grasaG: 0,
    esAlcohol: false,
    gradosAlcohol: null,
    origen: 'manual',
    tieneFoto: false,
    ...datos,
    id: nuevoId(),
    fecha,
    creadoEn: instante(fecha, hora),
  }
}

interface Almacen extends Registros {
  pesos: Peso[]
}

/** Los registros de ejemplo, situados en los siete días que terminan hoy. */
export function registrosDeEjemplo(hoy: ClaveDia = claveDia(new Date())): Almacen {
  const dias = ultimosDias(hoy, 7)
  const previos = dias.slice(0, 6)
  return {
    comidas: [
      ...previos.map((fecha, i) =>
        comida(fecha, '13:00', {
          tipo: 'almuerzo',
          nombre: 'Comidas del día',
          kcal: KCAL_PREVIAS[i],
          proteinaG: PROTEINA_PREVIA[i],
        }),
      ),
      comida(hoy, '07:30', {
        tipo: 'desayuno',
        nombre: 'Avena con plátano',
        kcal: 320,
        proteinaG: 9,
        carbohidratosG: 54,
        azucarG: 9,
        grasaG: 6,
      }),
      comida(hoy, '07:40', {
        tipo: 'desayuno',
        nombre: 'Café con leche',
        kcal: 100,
        proteinaG: 5,
        carbohidratosG: 8,
        azucarG: 5,
        grasaG: 4,
      }),
      comida(hoy, '13:10', {
        tipo: 'almuerzo',
        nombre: 'Arroz con pollo',
        porcion: '1 plato',
        kcal: 620,
        proteinaG: 38,
        carbohidratosG: 70,
        azucarG: 3,
        grasaG: 18,
        origen: 'ia',
      }),
      comida(hoy, '16:30', {
        tipo: 'licor',
        nombre: 'Cerveza artesanal 330 ml',
        porcion: '330 ml',
        kcal: 150,
        carbohidratosG: 14,
        azucarG: 2,
        esAlcohol: true,
        gradosAlcohol: 5.5,
      }),
    ],
    aguas: [
      ...previos.map((fecha, i) => ({
        id: nuevoId(),
        fecha,
        ml: AGUA_ML_PREVIA[i],
        creadoEn: instante(fecha, '12:00'),
      })),
      ...(
        [
          ['07:30', 250],
          ['10:15', 500],
          ['13:40', 500],
          ['16:05', 350],
        ] as const
      ).map(([hora, ml]) => ({ id: nuevoId(), fecha: hoy, ml, creadoEn: instante(hoy, hora) })),
    ],
    ejercicios: [
      ...previos.flatMap((fecha, i) =>
        EJERCICIO_MIN_PREVIO[i] > 0
          ? [
              {
                id: nuevoId(),
                fecha,
                minutos: EJERCICIO_MIN_PREVIO[i],
                nombre: 'Ejercicio',
                kcal: kcalDeEjercicio(EJERCICIO_MIN_PREVIO[i]),
                origenKcal: 'estimado' as const,
                creadoEn: instante(fecha, '18:00'),
              },
            ]
          : [],
      ),
      {
        id: nuevoId(),
        fecha: hoy,
        minutos: 20,
        nombre: 'Caminata rápida',
        kcal: 90,
        origenKcal: 'estimado',
        creadoEn: instante(hoy, '07:00'),
      },
      {
        id: nuevoId(),
        fecha: hoy,
        minutos: 15,
        nombre: 'Estiramiento',
        kcal: 40,
        origenKcal: 'estimado',
        creadoEn: instante(hoy, '12:30'),
      },
    ],
    suenos: [
      ...previos.map((fecha, i) => ({ fecha, minutos: SUENO_MIN_PREVIO[i] })),
      { fecha: hoy, minutos: 405 },
    ],
    siestas: [],
    pesos: PESOS_SEMANALES.map((kg, i) => ({
      fecha: sumarDias(hoy, -7 * (PESOS_SEMANALES.length - i) + 6),
      kg,
      nota: '',
    })),
  }
}

// En modo demostración todo vive en memoria: se pierde al recargar.
let perfilActual = perfilDeEjemplo()
let almacen = registrosDeEjemplo()
/** Fotos ultracomprimidas por id de comida; en demostración solo viven en memoria. */
const fotos = new Map<string, string>()

/** Para las pruebas: vuelve a los datos de ejemplo, o a los que se indiquen. */
export function restablecerPerfilMock(perfil: Perfil = perfilDeEjemplo()): void {
  perfilActual = perfil
}

export function restablecerRegistrosMock(datos: Almacen = registrosDeEjemplo()): void {
  almacen = datos
  fotos.clear()
}

const entre = (fecha: ClaveDia, desde: ClaveDia, hasta: ClaveDia) => fecha >= desde && fecha <= hasta

function quitar<T extends { id: string }>(lista: T[], id: string): T[] {
  if (!lista.some((elemento) => elemento.id === id)) throw new Error('No existe.')
  return lista.filter((elemento) => elemento.id !== id)
}

export const repositoriosMock: Repositorios = {
  perfil: {
    obtener: async () => perfilActual,
    guardarPlan: async (plan: Plan) => {
      perfilActual = { nombre: plan.datos.nombre, plan }
    },
  },
  registros: {
    obtenerRango: async (desde, hasta) => ({
      comidas: almacen.comidas.filter((c) => entre(c.fecha, desde, hasta)),
      aguas: almacen.aguas.filter((a) => entre(a.fecha, desde, hasta)),
      ejercicios: almacen.ejercicios.filter((e) => entre(e.fecha, desde, hasta)),
      suenos: almacen.suenos.filter((s) => entre(s.fecha, desde, hasta)),
      siestas: almacen.siestas.filter((s) => entre(s.fecha, desde, hasta)),
    }),
    obtenerResumenDiario: async (desde, hasta) => {
      const dias: ResumenDia[] = []
      for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
        const totales = totalesDelDia(almacen, fecha)
        const comidas = almacen.comidas.filter((c) => c.fecha === fecha)
        const licores = comidas.filter((c) => c.esAlcohol)
        dias.push({
          fecha,
          kcal: totales.kcal,
          proteinaG: totales.proteinaG,
          azucarG: comidas.reduce((suma, c) => suma + c.azucarG, 0),
          grasaG: comidas.reduce((suma, c) => suma + c.grasaG, 0),
          aguaMl: totales.aguaMl,
          ejercicioMin: totales.ejercicioMin,
          ejercicioKcal: totales.ejercicioKcal,
          suenoMin: totales.suenoMin,
          bebidasAlcohol: licores.length,
          kcalAlcohol: licores.reduce((suma, c) => suma + c.kcal, 0),
        })
      }
      return dias
    },
    obtenerComida: async (id) => almacen.comidas.find((c) => c.id === id) ?? null,
    agregarComida: async (nueva, foto) => {
      const creada: Comida = {
        ...nueva,
        id: nuevoId(),
        tieneFoto: Boolean(foto),
        creadoEn: new Date().toISOString(),
      }
      if (foto) fotos.set(creada.id, foto)
      almacen = { ...almacen, comidas: [...almacen.comidas, creada] }
      return creada
    },
    obtenerFoto: async (id) => fotos.get(id) ?? null,
    quitarFoto: async (id) => {
      fotos.delete(id)
      almacen = {
        ...almacen,
        comidas: almacen.comidas.map((c) => (c.id === id ? { ...c, tieneFoto: false } : c)),
      }
    },
    actualizarComida: async (id, cambios) => {
      const actual = almacen.comidas.find((c) => c.id === id)
      if (!actual) throw new Error('No existe.')
      const editada: Comida = { ...actual, ...cambios, origen: actual.origen }
      almacen = { ...almacen, comidas: almacen.comidas.map((c) => (c.id === id ? editada : c)) }
      return editada
    },
    eliminarComida: async (id) => {
      almacen = { ...almacen, comidas: quitar(almacen.comidas, id) }
    },
    agregarAgua: async (fecha, ml) => {
      const creada: Agua = { id: nuevoId(), fecha, ml, creadoEn: new Date().toISOString() }
      almacen = { ...almacen, aguas: [...almacen.aguas, creada] }
      return creada
    },
    eliminarAgua: async (id) => {
      almacen = { ...almacen, aguas: quitar(almacen.aguas, id) }
    },
    agregarEjercicio: async ({ fecha, minutos, nombre, kcal }) => {
      const creado: Ejercicio = {
        id: nuevoId(),
        fecha,
        minutos,
        nombre,
        kcal: kcal ?? kcalDeEjercicio(minutos),
        origenKcal: kcal === null ? 'estimado' : 'manual',
        creadoEn: new Date().toISOString(),
      }
      almacen = { ...almacen, ejercicios: [...almacen.ejercicios, creado] }
      return creado
    },
    eliminarEjercicio: async (id) => {
      almacen = { ...almacen, ejercicios: quitar(almacen.ejercicios, id) }
    },
    guardarSueno: async (sueno: Sueno) => {
      almacen = {
        ...almacen,
        suenos: [...almacen.suenos.filter((s) => s.fecha !== sueno.fecha), sueno],
      }
    },
    agregarSiesta: async (fecha, minutos) => {
      const creada: Siesta = { id: nuevoId(), fecha, minutos, creadoEn: new Date().toISOString() }
      almacen = { ...almacen, siestas: [...almacen.siestas, creada] }
      return creada
    },
    eliminarSiesta: async (id) => {
      almacen = { ...almacen, siestas: quitar(almacen.siestas, id) }
    },
    obtenerPesos: async (desde) =>
      almacen.pesos.filter((p) => p.fecha >= desde).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    obtenerPesoAnterior: async (fecha) =>
      almacen.pesos
        .filter((p) => p.fecha < fecha)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null,
    guardarPeso: async (peso) => {
      almacen = { ...almacen, pesos: [...almacen.pesos.filter((p) => p.fecha !== peso.fecha), peso] }
    },
  },
  // En modo demostración los recordatorios solo viven en el navegador.
  recordatorios: {
    sincroniza: false,
    obtener: async () => ({ recordatorios: [], correo: false, zonaHoraria: 'UTC' }),
    guardar: async () => undefined,
    guardarCorreo: async () => undefined,
  },
}
