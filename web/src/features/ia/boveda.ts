/**
 * Guarda la API key del usuario en este dispositivo, cifrada.
 *
 * La clave de cifrado es una `CryptoKey` AES-GCM **no extraíble** que vive en
 * IndexedDB: el navegador la usa para cifrar y descifrar, pero ningún script
 * puede leer sus bytes ni llevársela. La API key nunca se escribe en claro en
 * `localStorage`, en la URL ni en Supabase. Ver docs/tecnica/seguridad.md.
 *
 * Si el navegador no ofrece IndexedDB o WebCrypto (modo privado estricto), la
 * clave se conserva solo en memoria y se pierde al cerrar la pestaña.
 */

const BASE = 'kalo'
const ALMACEN = 'boveda'

interface Registro {
  llave: CryptoKey
  iv: Uint8Array<ArrayBuffer>
  cifrado: ArrayBuffer
}

const enMemoria = new Map<string, string>()

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(BASE, 1)
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(ALMACEN)
    peticion.onsuccess = () => resolver(peticion.result)
    peticion.onerror = () => rechazar(new Error('Sin almacén.'))
  })
}

async function operar<T>(modo: IDBTransactionMode, accion: (almacen: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const base = await abrir()
  try {
    return await new Promise<T>((resolver, rechazar) => {
      const peticion = accion(base.transaction(ALMACEN, modo).objectStore(ALMACEN))
      peticion.onsuccess = () => resolver(peticion.result)
      peticion.onerror = () => rechazar(new Error('Fallo del almacén.'))
    })
  } finally {
    base.close()
  }
}

const hayBoveda = () => typeof indexedDB !== 'undefined' && typeof crypto?.subtle?.encrypt === 'function'

export async function guardarSecreto(id: string, secreto: string): Promise<void> {
  enMemoria.set(id, secreto)
  if (!hayBoveda()) return
  try {
    const llave = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ])
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const cifrado = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      llave,
      new TextEncoder().encode(secreto),
    )
    const registro: Registro = { llave, iv, cifrado }
    await operar('readwrite', (almacen) => almacen.put(registro, id))
  } catch {
    // Sin almacén persistente, la clave queda solo en memoria.
  }
}

export async function leerSecreto(id: string): Promise<string | null> {
  const recordado = enMemoria.get(id)
  if (recordado !== undefined) return recordado
  if (!hayBoveda()) return null
  try {
    const registro = (await operar('readonly', (almacen) => almacen.get(id))) as Registro | undefined
    if (!registro) return null
    const claro = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: registro.iv },
      registro.llave,
      registro.cifrado,
    )
    const secreto = new TextDecoder().decode(claro)
    enMemoria.set(id, secreto)
    return secreto
  } catch {
    return null
  }
}

export async function borrarSecreto(id: string): Promise<void> {
  enMemoria.delete(id)
  if (!hayBoveda()) return
  try {
    await operar('readwrite', (almacen) => almacen.delete(id))
  } catch {
    // Nada que borrar.
  }
}
