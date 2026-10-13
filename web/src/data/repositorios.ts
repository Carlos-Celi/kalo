import type { Perfil, Plan } from '../domain/perfil'
import type { ResumenInicio } from '../domain/tipos'

/**
 * Contrato de acceso a datos. Las pantallas dependen solo de estas
 * interfaces, así la implementación (mock, IndexedDB, Supabase) se puede
 * cambiar sin tocarlas.
 */
export interface ResumenRepositorio {
  obtenerResumenInicio(): Promise<ResumenInicio>
}

export interface PerfilRepositorio {
  obtener(): Promise<Perfil>
  /** Guarda el resultado del onboarding y lo da por completado. */
  guardarPlan(plan: Plan): Promise<void>
}

export interface Repositorios {
  resumen: ResumenRepositorio
  perfil: PerfilRepositorio
}
