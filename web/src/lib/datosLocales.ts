import { olvidarSecretosEnMemoria } from '../features/ia/boveda'

/** Prefijos de todo lo que Kalo guarda en el navegador (chats, IA, recordatorios, avisos, freno del login). */
const PREFIJOS = ['kalo:', 'kalo.']

function limpiar(almacen: Storage | undefined): void {
  if (!almacen) return
  try {
    const claves: string[] = []
    for (let i = 0; i < almacen.length; i++) {
      const clave = almacen.key(i)
      if (clave && PREFIJOS.some((prefijo) => clave.startsWith(prefijo))) claves.push(clave)
    }
    claves.forEach((clave) => almacen.removeItem(clave))
  } catch {
    // Almacenamiento bloqueado: no hay nada que borrar.
  }
}

/**
 * Borra de este dispositivo todo lo que Kalo guardó: la API key cifrada y su
 * llave (IndexedDB «kalo»), la configuración de IA, los chats del asistente y
 * los recordatorios locales. Se usa al eliminar la cuenta.
 */
export async function borrarDatosLocales(): Promise<void> {
  olvidarSecretosEnMemoria()
  limpiar(typeof localStorage === 'undefined' ? undefined : localStorage)
  limpiar(typeof sessionStorage === 'undefined' ? undefined : sessionStorage)
  if (typeof indexedDB === 'undefined') return
  await new Promise<void>((resolver) => {
    try {
      const peticion = indexedDB.deleteDatabase('kalo')
      peticion.onsuccess = () => resolver()
      peticion.onerror = () => resolver()
      // Otra pestaña la tiene abierta: se borrará al cerrarla.
      peticion.onblocked = () => resolver()
    } catch {
      resolver()
    }
  })
}
