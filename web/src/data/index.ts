import { supabase } from '../lib/supabase'
import type { Habito } from '../domain/tipos'
import { repositoriosMock } from './mock'
import type { Repositorios } from './repositorios'
import { crearRepositoriosSupabase } from './supabase'
import { marcarUltimoRegistro } from './ultimoRegistro'

/** Tras guardar algo, avisa a Inicio de qué hábito cambió (para resaltarlo como «Nuevo»). */
function conAvisoDeRegistro(base: Repositorios): Repositorios {
  const origen = base.registros
  const avisar =
    (habito: Habito) =>
    <T>(resultado: T): T => {
      marcarUltimoRegistro(habito)
      return resultado
    }
  const registros = Object.create(origen) as Repositorios['registros']
  registros.agregarComida = (comida, foto) =>
    origen.agregarComida(comida, foto).then(avisar('comidas'))
  registros.agregarAgua = (fecha, ml) => origen.agregarAgua(fecha, ml).then(avisar('agua'))
  registros.agregarEjercicio = (ejercicio) =>
    origen.agregarEjercicio(ejercicio).then(avisar('ejercicio'))
  registros.guardarSueno = (sueno) => origen.guardarSueno(sueno).then(avisar('sueno'))
  registros.agregarSiesta = (fecha, minutos) =>
    origen.agregarSiesta(fecha, minutos).then(avisar('sueno'))
  return { ...base, registros }
}

/** Único punto donde se elige la implementación de datos. */
export const repositorios: Repositorios = conAvisoDeRegistro(
  supabase ? crearRepositoriosSupabase(supabase) : repositoriosMock,
)
