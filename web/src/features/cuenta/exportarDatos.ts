import { repositorios } from '../../data'
import type { ClaveDia } from '../../domain/fechas'

/** Desde cuándo se exporta: antes de esta fecha la app no existía. */
const DESDE: ClaveDia = '2020-01-01'

/**
 * Reúne todo lo que el servidor guarda de la persona (derecho de acceso y
 * portabilidad). Las fotos de las comidas no se incluyen para que el archivo
 * sea ligero; la API key de IA y los chats nunca salen del dispositivo.
 */
export async function reunirMisDatos(hoy: ClaveDia) {
  const [perfil, registros, pesos, recordatorios] = await Promise.all([
    repositorios.perfil.obtener(),
    repositorios.registros.obtenerRango(DESDE, hoy),
    repositorios.registros.obtenerPesos(DESDE),
    repositorios.recordatorios.obtener().catch(() => null),
  ])
  return {
    aplicacion: 'Kalo',
    exportadoEn: new Date().toISOString(),
    notas: [
      'Contiene tu perfil, tu plan, todos tus registros y tus recordatorios.',
      'No incluye las fotos de las comidas ni tu API key de IA, que nunca sale de tu dispositivo.',
    ],
    perfil,
    registros: { ...registros, pesos },
    recordatorios,
  }
}

/** Descarga los datos como un archivo JSON. */
export async function descargarMisDatos(hoy: ClaveDia): Promise<void> {
  const datos = await reunirMisDatos(hoy)
  const archivo = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = `kalo-mis-datos-${hoy}.json`
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  // Se libera después del clic para que el navegador alcance a leerlo.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
