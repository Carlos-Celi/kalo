import type { ResumenInicio } from '../domain/tipos'

/**
 * Contrato de acceso a datos. Las pantallas dependen solo de estas
 * interfaces, así la implementación (mock, IndexedDB, Supabase) se puede
 * cambiar sin tocarlas.
 */
export interface ResumenRepositorio {
  obtenerResumenInicio(): Promise<ResumenInicio>
}

export interface Repositorios {
  resumen: ResumenRepositorio
}
