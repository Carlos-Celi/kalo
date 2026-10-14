import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ACTIVIDADES,
  ALCOHOLES,
  OBJETIVOS,
  RESTRICCIONES,
  SEXOS,
  SUENOS_HABITUALES,
  type Perfil,
  type Plan,
} from '../domain/perfil'
import type { ResumenDia } from '../domain/progreso'
import { leerRecordatorios, type Recordatorio } from '../domain/recordatorios'
import {
  kcalDeEjercicio,
  TIPOS_COMIDA,
  type Agua,
  type Comida,
  type Ejercicio,
  type NuevaComida,
  type Peso,
  type Siesta,
  type Sueno,
} from '../domain/registros'
import type { Repositorios } from './repositorios'

const COLUMNAS_PERFIL =
  'nombre, edad, sexo, estatura_cm, peso_kg, objetivo, peso_meta_kg, actividad, sueno_habitual, alcohol, restricciones, meta_kcal, meta_proteina_g, meta_agua_ml, meta_ejercicio_min, meta_sueno_min, onboarding_completado_en'

const COLUMNAS_COMIDA =
  'id, fecha, tipo, nombre, porcion, kcal, proteina_g, carbohidratos_g, azucar_g, grasa_g, es_alcohol, grados_alcohol, origen, tiene_foto, creado_en'

type Fila = Record<string, unknown>

function numero(valor: unknown): number | null {
  // Postgres devuelve `numeric` como texto.
  const n = typeof valor === 'string' ? Number(valor) : valor
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '')

function unoDe<T extends string>(valor: unknown, opciones: readonly T[]): T | null {
  return opciones.find((opcion) => opcion === valor) ?? null
}

/** Convierte la fila en un plan; null si el onboarding no está completo o algo no cuadra. */
function planDe(fila: Fila): Plan | null {
  if (!fila.onboarding_completado_en) return null
  const nombre = typeof fila.nombre === 'string' ? fila.nombre : null
  const edad = numero(fila.edad)
  const sexo = unoDe(fila.sexo, SEXOS)
  const estaturaCm = numero(fila.estatura_cm)
  const pesoKg = numero(fila.peso_kg)
  const objetivo = unoDe(fila.objetivo, OBJETIVOS)
  const pesoMetaKg = numero(fila.peso_meta_kg)
  const actividad = unoDe(fila.actividad, ACTIVIDADES)
  const suenoHabitual = unoDe(fila.sueno_habitual, SUENOS_HABITUALES)
  const alcohol = unoDe(fila.alcohol, ALCOHOLES)
  const kcal = numero(fila.meta_kcal)
  const proteinaG = numero(fila.meta_proteina_g)
  const aguaMl = numero(fila.meta_agua_ml)
  const ejercicioMin = numero(fila.meta_ejercicio_min)
  const suenoMin = numero(fila.meta_sueno_min)
  if (
    nombre === null || edad === null || sexo === null || estaturaCm === null ||
    pesoKg === null || objetivo === null || pesoMetaKg === null || actividad === null ||
    suenoHabitual === null || alcohol === null || kcal === null || proteinaG === null ||
    aguaMl === null || ejercicioMin === null || suenoMin === null
  ) {
    return null
  }
  const declaradas: unknown[] = Array.isArray(fila.restricciones) ? fila.restricciones : []
  return {
    datos: {
      nombre,
      edad,
      sexo,
      estaturaCm,
      pesoKg,
      objetivo,
      pesoMetaKg,
      actividad,
      suenoHabitual,
      alcohol,
      restricciones: RESTRICCIONES.filter((restriccion) => declaradas.includes(restriccion)),
    },
    metas: { kcal, proteinaG, aguaL: aguaMl / 1000, ejercicioMin, suenoMin },
  }
}

function comidaDe(fila: Fila): Comida {
  return {
    id: texto(fila.id),
    fecha: texto(fila.fecha),
    tipo: unoDe(fila.tipo, TIPOS_COMIDA) ?? 'snack',
    nombre: texto(fila.nombre),
    porcion: texto(fila.porcion),
    kcal: numero(fila.kcal) ?? 0,
    proteinaG: numero(fila.proteina_g) ?? 0,
    carbohidratosG: numero(fila.carbohidratos_g) ?? 0,
    azucarG: numero(fila.azucar_g) ?? 0,
    grasaG: numero(fila.grasa_g) ?? 0,
    esAlcohol: fila.es_alcohol === true,
    gradosAlcohol: numero(fila.grados_alcohol),
    origen: fila.origen === 'ia' ? 'ia' : 'manual',
    tieneFoto: fila.tiene_foto === true,
    creadoEn: texto(fila.creado_en),
  }
}

function filaDeComida(comida: NuevaComida) {
  return {
    fecha: comida.fecha,
    tipo: comida.tipo,
    nombre: comida.nombre,
    porcion: comida.porcion,
    kcal: comida.kcal,
    proteina_g: comida.proteinaG,
    carbohidratos_g: comida.carbohidratosG,
    azucar_g: comida.azucarG,
    grasa_g: comida.grasaG,
    es_alcohol: comida.esAlcohol,
    grados_alcohol: comida.esAlcohol ? comida.gradosAlcohol : null,
  }
}

const COLUMNAS_EJERCICIO = 'id, fecha, minutos, nombre, kcal, kcal_origen, creado_en'

const aguaDe = (fila: Fila): Agua => ({
  id: texto(fila.id),
  fecha: texto(fila.fecha),
  ml: numero(fila.ml) ?? 0,
  creadoEn: texto(fila.creado_en),
})

const ejercicioDe = (fila: Fila): Ejercicio => ({
  id: texto(fila.id),
  fecha: texto(fila.fecha),
  minutos: numero(fila.minutos) ?? 0,
  nombre: texto(fila.nombre),
  kcal: numero(fila.kcal) ?? 0,
  origenKcal: fila.kcal_origen === 'manual' ? 'manual' : 'estimado',
  creadoEn: texto(fila.creado_en),
})

const siestaDe = (fila: Fila): Siesta => ({
  id: texto(fila.id),
  fecha: texto(fila.fecha),
  minutos: numero(fila.minutos) ?? 0,
  creadoEn: texto(fila.creado_en),
})

const suenoDe = (fila: Fila): Sueno => ({
  fecha: texto(fila.fecha),
  minutos: numero(fila.minutos) ?? 0,
})

const pesoDe = (fila: Fila): Peso => ({
  fecha: texto(fila.fecha),
  kg: numero(fila.kg) ?? 0,
  nota: texto(fila.nota),
})

const resumenDe = (fila: Fila): ResumenDia => ({
  fecha: texto(fila.fecha),
  kcal: numero(fila.kcal) ?? 0,
  proteinaG: numero(fila.proteina_g) ?? 0,
  azucarG: numero(fila.azucar_g) ?? 0,
  grasaG: numero(fila.grasa_g) ?? 0,
  aguaMl: numero(fila.agua_ml) ?? 0,
  ejercicioMin: numero(fila.ejercicio_min) ?? 0,
  ejercicioKcal: numero(fila.ejercicio_kcal) ?? 0,
  suenoMin: numero(fila.sueno_min) ?? 0,
  bebidasAlcohol: numero(fila.bebidas_alcohol) ?? 0,
  kcalAlcohol: numero(fila.kcal_alcohol) ?? 0,
})

interface Respuesta {
  data: unknown
  error: unknown
}

/** Filas de una respuesta, o un error genérico: el mensaje del servidor no sale de aquí. */
function filas({ data, error }: Respuesta, queFallo: string): Fila[] {
  if (error || !Array.isArray(data)) throw new Error(queFallo)
  return data as Fila[]
}

function unaFila(respuesta: Respuesta, queFallo: string): Fila {
  const [fila] = filas(respuesta, queFallo)
  if (!fila) throw new Error(queFallo)
  return fila
}

/**
 * Repositorios sobre Supabase.
 *
 * Las lecturas no filtran por usuario: RLS devuelve únicamente las filas
 * propias. Las escrituras tampoco envían `usuario_id`: lo pone la base de datos.
 */
export function crearRepositoriosSupabase(cliente: SupabaseClient): Repositorios {
  async function idDeUsuario(): Promise<string> {
    const { data } = await cliente.auth.getSession()
    const id = data.session?.user.id
    if (!id) throw new Error('No hay sesión.')
    return id
  }

  /** Crea o sustituye la fila del día en una tabla con clave (usuario, fecha). */
  async function guardarDelDia(tabla: 'suenos' | 'pesos', fecha: string, valores: Fila) {
    // La API no admite un UPDATE sin filtro; RLS limita igualmente a las filas propias.
    const id = await idDeUsuario()
    const actualizadas = filas(
      await cliente
        .from(tabla)
        .update(valores)
        .eq('usuario_id', id)
        .eq('fecha', fecha)
        .select('fecha'),
      'No se pudo guardar.',
    )
    if (actualizadas.length > 0) return
    const { error } = await cliente.from(tabla).insert({ fecha, ...valores })
    if (error) throw new Error('No se pudo guardar.')
  }

  async function borrar(tabla: 'comidas' | 'aguas' | 'ejercicios' | 'siestas', id: string) {
    unaFila(await cliente.from(tabla).delete().eq('id', id).select('id'), 'No se pudo borrar.')
  }

  return {
    perfil: {
      async obtener(): Promise<Perfil> {
        const { data, error } = await cliente.from('perfiles').select(COLUMNAS_PERFIL).maybeSingle()
        if (error) throw new Error('No se pudo leer el perfil.')
        const fila: Fila = data ?? {}
        return { nombre: texto(fila.nombre), plan: planDe(fila) }
      },
      async guardarPlan({ datos, metas }) {
        const id = await idDeUsuario()
        unaFila(
          await cliente
            .from('perfiles')
            .update({
              nombre: datos.nombre,
              edad: datos.edad,
              sexo: datos.sexo,
              estatura_cm: datos.estaturaCm,
              peso_kg: datos.pesoKg,
              objetivo: datos.objetivo,
              peso_meta_kg: datos.pesoMetaKg,
              actividad: datos.actividad,
              sueno_habitual: datos.suenoHabitual,
              alcohol: datos.alcohol,
              restricciones: datos.restricciones,
              meta_kcal: metas.kcal,
              meta_proteina_g: metas.proteinaG,
              meta_agua_ml: Math.round(metas.aguaL * 1000),
              meta_ejercicio_min: metas.ejercicioMin,
              meta_sueno_min: metas.suenoMin,
              onboarding_completado_en: new Date().toISOString(),
            })
            .eq('id', id)
            .select('id'),
          'No se pudo guardar el plan.',
        )
      },
      async eliminarCuenta() {
        // La función borra a quien llama; por cascada caen su perfil y todos sus registros.
        const { error } = await cliente.rpc('eliminar_mi_cuenta')
        if (error) throw new Error('No se pudo eliminar la cuenta.')
      },
    },
    registros: {
      async obtenerRango(desde, hasta) {
        const enRango = (tabla: string, columnas: string) =>
          cliente.from(tabla).select(columnas).gte('fecha', desde).lte('fecha', hasta)
        const [comidas, aguas, ejercicios, suenos, siestas] = await Promise.all([
          enRango('comidas', COLUMNAS_COMIDA).order('creado_en'),
          enRango('aguas', 'id, fecha, ml, creado_en').order('creado_en'),
          enRango('ejercicios', COLUMNAS_EJERCICIO).order('creado_en'),
          enRango('suenos', 'fecha, minutos'),
          enRango('siestas', 'id, fecha, minutos, creado_en').order('creado_en'),
        ])
        const fallo = 'No se pudieron leer los registros.'
        return {
          comidas: filas(comidas, fallo).map(comidaDe),
          aguas: filas(aguas, fallo).map(aguaDe),
          ejercicios: filas(ejercicios, fallo).map(ejercicioDe),
          suenos: filas(suenos, fallo).map(suenoDe),
          siestas: filas(siestas, fallo).map(siestaDe),
        }
      },
      async obtenerResumenDiario(desde, hasta) {
        return filas(
          await cliente.rpc('resumen_diario', { desde, hasta }),
          'No se pudo leer el resumen.',
        ).map(resumenDe)
      },
      async obtenerComida(id) {
        const [fila] = filas(
          await cliente.from('comidas').select(COLUMNAS_COMIDA).eq('id', id),
          'No se pudo leer la comida.',
        )
        return fila ? comidaDe(fila) : null
      },
      async agregarComida(comida, foto) {
        return comidaDe(
          unaFila(
            await cliente
              .from('comidas')
              .insert({ ...filaDeComida(comida), origen: comida.origen, ...(foto ? { foto } : {}) })
              .select(COLUMNAS_COMIDA),
            'No se pudo guardar la comida.',
          ),
        )
      },
      async obtenerFoto(id) {
        const [fila] = filas(
          await cliente.from('comidas').select('foto').eq('id', id),
          'No se pudo leer la foto.',
        )
        return fila && typeof fila.foto === 'string' ? fila.foto : null
      },
      async quitarFoto(id) {
        unaFila(
          await cliente.from('comidas').update({ foto: null }).eq('id', id).select('id'),
          'No se pudo quitar la foto.',
        )
      },
      async actualizarComida(id, comida) {
        return comidaDe(
          unaFila(
            await cliente
              .from('comidas')
              .update(filaDeComida(comida))
              .eq('id', id)
              .select(COLUMNAS_COMIDA),
            'No se pudo guardar la comida.',
          ),
        )
      },
      eliminarComida: (id) => borrar('comidas', id),
      async agregarAgua(fecha, ml) {
        return aguaDe(
          unaFila(
            await cliente.from('aguas').insert({ fecha, ml }).select('id, fecha, ml, creado_en'),
            'No se pudo guardar el agua.',
          ),
        )
      },
      eliminarAgua: (id) => borrar('aguas', id),
      async agregarEjercicio({ fecha, minutos, nombre, kcal }) {
        return ejercicioDe(
          unaFila(
            await cliente
              .from('ejercicios')
              .insert({
                fecha,
                minutos,
                nombre,
                kcal: kcal ?? kcalDeEjercicio(minutos),
                kcal_origen: kcal === null ? 'estimado' : 'manual',
              })
              .select(COLUMNAS_EJERCICIO),
            'No se pudo guardar el ejercicio.',
          ),
        )
      },
      eliminarEjercicio: (id) => borrar('ejercicios', id),
      guardarSueno: ({ fecha, minutos }) => guardarDelDia('suenos', fecha, { minutos }),
      async agregarSiesta(fecha, minutos) {
        return siestaDe(
          unaFila(
            await cliente
              .from('siestas')
              .insert({ fecha, minutos })
              .select('id, fecha, minutos, creado_en'),
            'No se pudo guardar la siesta.',
          ),
        )
      },
      eliminarSiesta: (id) => borrar('siestas', id),
      async obtenerPesos(desde) {
        return filas(
          await cliente.from('pesos').select('fecha, kg, nota').gte('fecha', desde).order('fecha'),
          'No se pudo leer el peso.',
        ).map(pesoDe)
      },
      async obtenerPesoAnterior(fecha) {
        const [fila] = filas(
          await cliente
            .from('pesos')
            .select('fecha, kg, nota')
            .lt('fecha', fecha)
            .order('fecha', { ascending: false })
            .limit(1),
          'No se pudo leer el peso.',
        )
        return fila ? pesoDe(fila) : null
      },
      guardarPeso: ({ fecha, kg, nota }) => guardarDelDia('pesos', fecha, { kg, nota }),
    },
    recordatorios: {
      sincroniza: true,
      async obtener() {
        const [recordatorios, perfil] = await Promise.all([
          cliente
            .from('recordatorios')
            .select('id, tipo, nombre, horas, dias, activo')
            .order('orden'),
          cliente.from('perfiles').select('avisos_correo, zona_horaria').maybeSingle(),
        ])
        const filasRecordatorios = filas(recordatorios, 'No se pudieron leer los recordatorios.')
        if (perfil.error) throw new Error('No se pudieron leer los avisos.')
        // Se pasa por la misma validación que lo guardado en el dispositivo.
        const validos = leerRecordatorios(
          filasRecordatorios.map(({ id, tipo, nombre, horas, dias, activo }) => ({
            id, tipo, nombre, horas, dias, activo,
          })),
        )
        return {
          recordatorios: validos ?? [],
          correo: perfil.data?.avisos_correo === true,
          zonaHoraria: texto(perfil.data?.zona_horaria) || 'UTC',
        }
      },
      async guardar(lista: Recordatorio[]) {
        const fallo = 'No se pudieron guardar los recordatorios.'
        const actuales = filas(await cliente.from('recordatorios').select('id'), fallo).map((fila) =>
          texto(fila.id),
        )
        if (lista.length > 0) {
          const { error } = await cliente.from('recordatorios').upsert(
            lista.map((recordatorio, orden) => ({
              id: recordatorio.id,
              tipo: recordatorio.tipo,
              nombre: recordatorio.nombre,
              horas: recordatorio.horas,
              dias: recordatorio.dias,
              activo: recordatorio.activo,
              orden,
            })),
            { onConflict: 'usuario_id,id' },
          )
          if (error) throw new Error(fallo)
        }
        const conservados = new Set(lista.map((recordatorio) => recordatorio.id))
        const sobran = actuales.filter((id) => !conservados.has(id))
        if (sobran.length > 0) {
          const { error } = await cliente.from('recordatorios').delete().in('id', sobran)
          if (error) throw new Error(fallo)
        }
      },
      async guardarCorreo(activo, zonaHoraria) {
        const id = await idDeUsuario()
        unaFila(
          await cliente
            .from('perfiles')
            .update({ avisos_correo: activo, zona_horaria: zonaHoraria })
            .eq('id', id)
            .select('id'),
          'No se pudo guardar el aviso por correo.',
        )
      },
    },
  }
}
