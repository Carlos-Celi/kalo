// Envía por correo los recordatorios que tocan ahora.
//
// La invoca una tarea programada (pg_cron) cada 5 minutos con la cabecera
// `x-cron-secret`. Para cada persona con los avisos por correo activados:
// calcula qué hora es en su zona, decide qué recordatorios tocan y no se han
// enviado, descarta los que ya están cumplidos (avisos inteligentes) y manda
// un único correo con el resto. Guía: docs/tecnica/recordatorios-por-correo.md
//
// Secretos (supabase secrets set …, nunca en git):
//   CRON_SECRET        compartido con la tarea programada
//   RESEND_API_KEY     API key de Resend
//   CORREO_REMITENTE   p. ej. "Kalo <avisos@tu-dominio.com>"
//   URL_APP            p. ej. "https://kalo.vercel.app"
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  avisosPendientes,
  componerCorreo,
  convieneAvisar,
  momentoLocal,
  textoDelAviso,
  type Recordatorio,
} from '../_shared/avisos.ts'

const LOTE = 500

function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diferencia = 0
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferencia === 0
}

function entorno(nombre: string): string {
  const valor = Deno.env.get(nombre)
  if (!valor) throw new Error(`Falta el secreto ${nombre}.`)
  return valor
}

Deno.serve(async (peticion) => {
  if (peticion.method !== 'POST') return new Response('Método no permitido', { status: 405 })

  let secreto: string
  try {
    secreto = entorno('CRON_SECRET')
  } catch {
    return new Response('Función sin configurar', { status: 500 })
  }
  if (!iguales(peticion.headers.get('x-cron-secret') ?? '', secreto)) {
    return new Response('No autorizado', { status: 401 })
  }

  const servicio = createClient(entorno('SUPABASE_URL'), entorno('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })
  const remitente = entorno('CORREO_REMITENTE')
  const claveResend = entorno('RESEND_API_KEY')
  const urlApp = Deno.env.get('URL_APP') ?? 'https://kalo.app'
  const ahora = new Date()

  const { data: personas, error } = await servicio
    .from('perfiles')
    .select('id, nombre, zona_horaria, meta_agua_ml, meta_ejercicio_min')
    .eq('avisos_correo', true)
    .not('onboarding_completado_en', 'is', null)
    .limit(LOTE)
  if (error) return new Response('No se pudieron leer los perfiles', { status: 500 })

  let enviados = 0
  let fallidos = 0

  for (const persona of personas ?? []) {
    try {
      const local = momentoLocal(ahora, persona.zona_horaria ?? 'UTC')

      const { data: filas } = await servicio
        .from('recordatorios')
        .select('id, tipo, nombre, horas, dias')
        .eq('usuario_id', persona.id)
        .eq('activo', true)
      const recordatorios: Recordatorio[] = (filas ?? []).map((fila) => ({
        id: fila.id,
        tipo: fila.tipo,
        nombre: fila.nombre,
        horas: fila.horas,
        dias: fila.dias,
      }))

      const { data: previos } = await servicio
        .from('avisos_enviados')
        .select('clave')
        .eq('usuario_id', persona.id)
        .like('clave', `${local.fecha}|%`)
      const entregados = new Set<string>((previos ?? []).map((fila) => fila.clave))

      const pendientes = avisosPendientes(recordatorios, local, entregados)
      if (pendientes.length === 0) continue

      const [aguas, ejercicios, comidas] = await Promise.all([
        servicio.from('aguas').select('ml').eq('usuario_id', persona.id).eq('fecha', local.fecha),
        servicio.from('ejercicios').select('minutos').eq('usuario_id', persona.id).eq('fecha', local.fecha),
        servicio.from('comidas').select('tipo').eq('usuario_id', persona.id).eq('fecha', local.fecha),
      ])
      const totales = {
        aguaMl: (aguas.data ?? []).reduce((suma, fila) => suma + (fila.ml as number), 0),
        ejercicioMin: (ejercicios.data ?? []).reduce((suma, fila) => suma + (fila.minutos as number), 0),
        tiposDeComida: new Set((comidas.data ?? []).map((fila) => fila.tipo as string)).size,
      }
      const metas = {
        aguaMl: persona.meta_agua_ml ?? 2500,
        ejercicioMin: persona.meta_ejercicio_min ?? 60,
      }

      const aEnviar = pendientes.filter((aviso) => convieneAvisar(aviso, totales, metas))
      if (aEnviar.length > 0) {
        const { data: cuenta } = await servicio.auth.admin.getUserById(persona.id)
        const destino = cuenta.user?.email
        if (!destino) continue

        const correo = componerCorreo(persona.nombre ?? '', aEnviar.map((aviso) => textoDelAviso(aviso.recordatorio)), urlApp)
        const respuesta = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${claveResend}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: remitente,
            to: [destino],
            subject: correo.asunto,
            text: correo.texto,
            html: correo.html,
          }),
        })
        if (!respuesta.ok) {
          // No se registran como enviados: se reintentan en la siguiente pasada, dentro de la ventana.
          fallidos += 1
          continue
        }
        enviados += 1
      }

      // También se registran los descartados por estar cumplidos: no hay que volver a evaluarlos.
      await servicio
        .from('avisos_enviados')
        .upsert(pendientes.map((aviso) => ({ usuario_id: persona.id, clave: aviso.clave })))
    } catch {
      fallidos += 1
    }
  }

  // Las claves llevan la fecha: pasados unos días ya no sirven.
  const limite = new Date(ahora.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
  await servicio.from('avisos_enviados').delete().lt('enviado_en', limite)

  return Response.json({ personas: personas?.length ?? 0, enviados, fallidos })
})
