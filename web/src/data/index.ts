import { supabase } from '../lib/supabase'
import { repositoriosMock } from './mock'
import type { Repositorios } from './repositorios'
import { crearRepositoriosSupabase } from './supabase'

/** Único punto donde se elige la implementación de datos. */
export const repositorios: Repositorios = supabase
  ? crearRepositoriosSupabase(supabase)
  : repositoriosMock
