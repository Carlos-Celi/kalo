// Lógica pura de los recordatorios por correo. No usa nada propio de Deno para
// poder probarla con Node (avisos.test.ts). Reproduce las reglas del cliente
// (web/src/domain/recordatorios.ts): si cambian allí, cambian aquí.

export interface Recordatorio {
  id: string
  tipo: 'agua' | 'comidas' | 'ejercicio' | 'dormir' | 'peso' | 'propio'
  nombre: string
  /** "08:00", en la hora local de la persona. */
  horas: string[]
  /** 0 = domingo … 6 = sábado. */
  dias: number[]
}

/** Qué día y minuto del día es ahora para una persona. */
export interface MomentoLocal {
  /** "2026-10-14" */
  fecha: string
  dia: number
  /** Minutos desde medianoche. */
  minuto: number
}

const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Minutos tras la hora programada en los que el aviso todavía se envía. */
export const VENTANA_MIN = 10

export function momentoLocal(ahora: Date, zona: string): MomentoLocal {
  const formatear = (zonaHoraria: string) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: zonaHoraria,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short',
      hourCycle: 'h23',
    }).formatToParts(ahora)

  let partes: Intl.DateTimeFormatPart[]
  try {
    partes = formatear(zona)
  } catch {
    // Una zona desconocida no debe impedir el aviso: se usa UTC.
    partes = formatear('UTC')
  }
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value ?? ''
  return {
    fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
    dia: Math.max(DIAS.indexOf(valor('weekday')), 0),
    minuto: Number(valor('hour')) * 60 + Number(valor('minute')),
  }
}

export interface AvisoPendiente {
  recordatorio: Recordatorio
  hora: string
  /** Identifica este aviso concreto ("2026-10-14|agua|08:00"). */
  clave: string
}

export function avisosPendientes(
  recordatorios: Recordatorio[],
  ahora: MomentoLocal,
  entregados: ReadonlySet<string>,
): AvisoPendiente[] {
  return recordatorios
    .filter((recordatorio) => recordatorio.dias.includes(ahora.dia))
    .flatMap((recordatorio) =>
      recordatorio.horas.flatMap((hora) => {
        const minuto = Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3))
        const clave = `${ahora.fecha}|${recordatorio.id}|${hora}`
        const toca = ahora.minuto >= minuto && ahora.minuto < minuto + VENTANA_MIN
        return toca && !entregados.has(clave) ? [{ recordatorio, hora, clave }] : []
      }),
    )
}

export interface TotalesDia {
  aguaMl: number
  ejercicioMin: number
  /** Tipos de comida distintos con algo registrado hoy. */
  tiposDeComida: number
}

export interface Metas {
  aguaMl: number
  ejercicioMin: number
}

/** Avisos inteligentes: no se avisa de lo que ya está hecho. */
export function convieneAvisar(
  { recordatorio, hora }: AvisoPendiente,
  totales: TotalesDia,
  metas: Metas,
): boolean {
  switch (recordatorio.tipo) {
    case 'agua':
      return totales.aguaMl < metas.aguaMl
    case 'ejercicio':
      return totales.ejercicioMin < metas.ejercicioMin
    case 'comidas':
      return totales.tiposDeComida < recordatorio.horas.indexOf(hora) + 1
    default:
      return true
  }
}

export function textoDelAviso({ tipo, nombre }: Recordatorio): { titulo: string; cuerpo: string } {
  switch (tipo) {
    case 'agua':
      return { titulo: 'Hora de beber agua', cuerpo: 'Un vaso ahora te acerca a tu meta de hoy.' }
    case 'comidas':
      return { titulo: 'Registra tu comida', cuerpo: 'Anótala ahora para no perder la cuenta del día.' }
    case 'ejercicio':
      return { titulo: 'Hora de moverte', cuerpo: 'Unos minutos de ejercicio suman a tu meta.' }
    case 'dormir':
      return { titulo: 'Hora de ir a dormir', cuerpo: 'Dormir bien ayuda a regular el hambre.' }
    case 'peso':
      return { titulo: 'Toca pesarte', cuerpo: 'Registra tu peso para mantener tu gráfica al día.' }
    case 'propio':
      return { titulo: nombre, cuerpo: 'Recordatorio de Kalo.' }
  }
}

const escapar = (texto: string) =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export interface Correo {
  asunto: string
  texto: string
  html: string
}

/** Un solo correo con todos los avisos que tocan en esta pasada. */
export function componerCorreo(nombre: string, avisos: { titulo: string; cuerpo: string }[], urlApp: string): Correo {
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,'
  const asunto = avisos.length === 1 ? avisos[0].titulo : `Kalo: ${avisos.length} recordatorios`
  const texto = [
    saludo,
    '',
    ...avisos.map(({ titulo, cuerpo }) => `• ${titulo}: ${cuerpo}`),
    '',
    `Abre Kalo: ${urlApp}`,
    '',
    'Recibes este correo porque activaste los recordatorios por correo en Kalo. Puedes desactivarlos en Recordatorios.',
  ].join('\n')
  const lista = avisos
    .map(
      ({ titulo, cuerpo }) =>
        `<li style="margin:0 0 12px"><strong>${escapar(titulo)}</strong><br><span style="color:#5a4337">${escapar(cuerpo)}</span></li>`,
    )
    .join('')
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#fff8f2;font-family:Arial,Helvetica,sans-serif;color:#2b1810"><div style="max-width:480px;margin:0 auto;padding:24px"><p style="font-size:20px;font-weight:bold;color:#d13d0a;margin:0 0 16px">kalo</p><p style="margin:0 0 16px">${escapar(saludo)}</p><ul style="padding-left:18px;margin:0 0 20px">${lista}</ul><p style="margin:0 0 24px"><a href="${escapar(urlApp)}" style="background:#d13d0a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:bold;display:inline-block">Abrir Kalo</a></p><p style="font-size:12px;color:#7a6458;margin:0">Recibes este correo porque activaste los recordatorios por correo en Kalo. Puedes desactivarlos en Recordatorios.</p></div></body></html>`
  return { asunto, texto, html }
}
