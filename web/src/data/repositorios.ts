import type { ClaveDia } from '../domain/fechas'
import type { Perfil, Plan } from '../domain/perfil'
import type { Recordatorio } from '../domain/recordatorios'
import type { ResumenDia } from '../domain/progreso'
import type {
  Agua,
  Comida,
  Ejercicio,
  NuevaComida,
  NuevoEjercicio,
  Peso,
  Registros,
  Siesta,
  Sueno,
} from '../domain/registros'

/**
 * Contrato de acceso a datos. Las pantallas dependen solo de estas
 * interfaces, así la implementación (mock, Supabase) se puede cambiar sin
 * tocarlas. Todos los métodos rechazan si la operación falla.
 */
export interface PerfilRepositorio {
  obtener(): Promise<Perfil>
  /** Guarda el resultado del onboarding y lo da por completado. */
  guardarPlan(plan: Plan): Promise<void>
  /** Borra la cuenta y todos sus datos del servidor. No se puede deshacer. */
  eliminarCuenta(): Promise<void>
}

export interface RegistrosRepositorio {
  /** Todo lo registrado entre dos días, ambos incluidos. */
  obtenerRango(desde: ClaveDia, hasta: ClaveDia): Promise<Registros>
  /** Totales por día entre dos fechas, una fila por día (para las gráficas). */
  obtenerResumenDiario(desde: ClaveDia, hasta: ClaveDia): Promise<ResumenDia[]>
  obtenerComida(id: string): Promise<Comida | null>
  /** `foto`: data URL ya ultracomprimida, o null si no se guarda. */
  agregarComida(comida: NuevaComida, foto?: string | null): Promise<Comida>
  /** La foto guardada con una comida, o null si no tiene. */
  obtenerFoto(id: string): Promise<string | null>
  quitarFoto(id: string): Promise<void>
  actualizarComida(id: string, comida: NuevaComida): Promise<Comida>
  eliminarComida(id: string): Promise<void>
  agregarAgua(fecha: ClaveDia, ml: number): Promise<Agua>
  eliminarAgua(id: string): Promise<void>
  agregarEjercicio(ejercicio: NuevoEjercicio): Promise<Ejercicio>
  eliminarEjercicio(id: string): Promise<void>
  /** Una noche por día: crea o sustituye. */
  guardarSueno(sueno: Sueno): Promise<void>
  /** Una siesta más durante el día. */
  agregarSiesta(fecha: ClaveDia, minutos: number): Promise<Siesta>
  eliminarSiesta(id: string): Promise<void>
  /** Pesos desde `desde`, en orden cronológico. */
  obtenerPesos(desde: ClaveDia): Promise<Peso[]>
  /** El último peso registrado antes de `fecha`, si lo hay. */
  obtenerPesoAnterior(fecha: ClaveDia): Promise<Peso | null>
  /** Un peso por día: crea o sustituye. */
  guardarPeso(peso: Peso): Promise<void>
}

/** Lo que guarda el servidor de los recordatorios: ellos mismos y si también llegan por correo. */
export interface AvisosRemotos {
  recordatorios: Recordatorio[]
  correo: boolean
  zonaHoraria: string
}

export interface RecordatoriosRepositorio {
  /** false si no hay servidor (modo demostración): los recordatorios solo viven en el navegador. */
  readonly sincroniza: boolean
  obtener(): Promise<AvisosRemotos>
  /** Sustituye el conjunto de recordatorios del usuario. */
  guardar(recordatorios: Recordatorio[]): Promise<void>
  guardarCorreo(activo: boolean, zonaHoraria: string): Promise<void>
}

export interface Repositorios {
  perfil: PerfilRepositorio
  registros: RegistrosRepositorio
  recordatorios: RecordatoriosRepositorio
}
