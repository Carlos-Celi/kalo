import { repositoriosMock } from './mock'
import type { Repositorios } from './repositorios'

/** Único punto donde se elige la implementación de datos. */
export const repositorios: Repositorios = repositoriosMock
