import { useEffect, useEffectEvent, useRef, useState } from 'react'
import icono from '../../assets/kalo-icono.png'
import { repositorios } from '../../data'
import { claveDia } from '../../domain/fechas'
import {
  avisosPendientes,
  convieneAvisar,
  textoDelAviso,
  type Recordatorio,
} from '../../domain/recordatorios'
import { totalesDelDia } from '../../domain/registros'
import { usePerfil } from '../perfil/contexto'
import { permisoDeAvisos, useRecordatorios, zonaHorariaLocal } from './almacen'

const CADA_MS = 30_000
const CLAVE_ENTREGADOS = 'kalo:avisos-entregados'

/** Avisos ya mostrados hoy; compartidos entre pestañas para no duplicarlos. */
function leerEntregados(): Set<string> {
  try {
    const guardado: unknown = JSON.parse(localStorage.getItem(CLAVE_ENTREGADOS) ?? '[]')
    return new Set(Array.isArray(guardado) ? guardado.filter((clave) => typeof clave === 'string') : [])
  } catch {
    return new Set()
  }
}

function guardarEntregados(entregados: Set<string>) {
  try {
    // Solo interesan los últimos: las claves llevan la fecha y caducan solas.
    localStorage.setItem(CLAVE_ENTREGADOS, JSON.stringify([...entregados].slice(-60)))
  } catch {
    // Sin almacenamiento: como mucho se repetiría un aviso al recargar.
  }
}

/**
 * Entrega los recordatorios como notificaciones del navegador mientras Kalo
 * está abierto. No pinta nada.
 */
export function AvisosRecordatorios() {
  const { recordatorios, guardar } = useRecordatorios()
  const { perfil } = usePerfil()
  const metas = perfil.plan?.metas
  const hayPlan = metas !== undefined
  const ocupado = useRef(false)
  // Lo que había en el dispositivo al abrir: si el servidor está vacío, se sube.
  const [alAbrir] = useState(recordatorios)
  const guardarLocal = useEffectEvent((remotos: Recordatorio[]) => guardar(remotos, { enNube: false }))

  // Al abrir Kalo con una cuenta se alinea el dispositivo con el servidor
  // (que es quien envía los correos): lo que haya en la nube manda; si no
  // hay nada, se sube lo del dispositivo.
  useEffect(() => {
    if (!repositorios.recordatorios.sincroniza || !hayPlan) return
    let vigente = true
    repositorios.recordatorios
      .obtener()
      .then(async ({ recordatorios: remotos, correo, zonaHoraria }) => {
        if (!vigente) return
        if (remotos.length > 0) guardarLocal(remotos)
        else await repositorios.recordatorios.guardar(alAbrir)
        // Si viajaste, el servidor tiene que saber qué hora es ahora para ti.
        if (correo && zonaHoraria !== zonaHorariaLocal()) {
          await repositorios.recordatorios.guardarCorreo(true, zonaHorariaLocal())
        }
      })
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [hayPlan, alAbrir])

  useEffect(() => {
    if (!metas) return

    async function revisar() {
      if (ocupado.current || permisoDeAvisos() !== 'concedido') return
      const entregados = leerEntregados()
      const pendientes = avisosPendientes(recordatorios, new Date(), entregados)
      if (pendientes.length === 0 || !metas) return
      ocupado.current = true
      try {
        const hoy = claveDia(new Date())
        const registros = await repositorios.registros.obtenerRango(hoy, hoy)
        const totales = totalesDelDia(registros, hoy)
        for (const pendiente of pendientes) {
          entregados.add(pendiente.clave)
          if (!convieneAvisar(pendiente, totales, totales.tiposDeComida, metas)) continue
          const { titulo, cuerpo } = textoDelAviso(pendiente.recordatorio)
          new Notification(titulo, { body: cuerpo, icon: icono, tag: pendiente.clave })
        }
        guardarEntregados(entregados)
      } catch {
        // Sin conexión no se puede decidir: se reintenta en la siguiente pasada.
      } finally {
        ocupado.current = false
      }
    }

    void revisar()
    const reloj = setInterval(() => void revisar(), CADA_MS)
    return () => clearInterval(reloj)
  }, [recordatorios, metas])

  return null
}
