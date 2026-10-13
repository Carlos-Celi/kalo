import { useCallback, useEffect, useMemo, useState } from 'react'
import { repositorios } from '../../data'
import { claveDia, sumarDias, type ClaveDia } from '../../domain/fechas'
import type { NuevoEjercicio, Registros } from '../../domain/registros'

type Estado = { fase: 'cargando' } | { fase: 'error' } | { fase: 'listo'; registros: Registros }

/** Cada acción resuelve a true si se guardó, para que un formulario sepa cuándo limpiarse. */
export interface AccionesRegistros {
  agregarAgua: (fecha: ClaveDia, ml: number) => Promise<boolean>
  /** Quita el último registro de agua de ese día. */
  deshacerAgua: (fecha: ClaveDia) => Promise<boolean>
  agregarEjercicio: (ejercicio: NuevoEjercicio) => Promise<boolean>
  eliminarEjercicio: (id: string) => Promise<boolean>
  deshacerEjercicio: (fecha: ClaveDia) => Promise<boolean>
  /** La noche que termina en `fecha`. */
  guardarSueno: (fecha: ClaveDia, minutos: number) => Promise<boolean>
  agregarSiesta: (fecha: ClaveDia, minutos: number) => Promise<boolean>
  eliminarSiesta: (id: string) => Promise<boolean>
}

export interface ResultadoRegistros {
  hoy: ClaveDia
  estado: Estado
  /** true si la última escritura falló; se limpia con la siguiente que salga bien. */
  fallo: boolean
  acciones: AccionesRegistros
}

function ultimoDe<T extends { fecha: ClaveDia; creadoEn: string }>(lista: T[], fecha: ClaveDia) {
  return lista
    .filter((elemento) => elemento.fecha === fecha)
    .sort((a, b) => a.creadoEn.localeCompare(b.creadoEn))
    .at(-1)
}

/**
 * Registros de los últimos `dias` días (hoy incluido) y las acciones rápidas
 * sobre ellos. La pantalla se actualiza con lo que confirma el servidor.
 */
export function useRegistros(dias: number): ResultadoRegistros {
  const [hoy] = useState(() => claveDia(new Date()))
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vigente = true
    repositorios.registros
      .obtenerRango(sumarDias(hoy, -(dias - 1)), hoy)
      .then((registros) => {
        if (vigente) setEstado({ fase: 'listo', registros })
      })
      .catch(() => {
        if (vigente) setEstado({ fase: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [hoy, dias])

  const registros = estado.fase === 'listo' ? estado.registros : null

  /** Ejecuta una escritura y aplica su resultado a los registros cargados. */
  const escribir = useCallback(
    <T,>(operacion: Promise<T>, aplicar: (actuales: Registros, resultado: T) => Registros) =>
      operacion
        .then((resultado) => {
          setFallo(false)
          setEstado((actual) =>
            actual.fase === 'listo'
              ? { fase: 'listo', registros: aplicar(actual.registros, resultado) }
              : actual,
          )
          return true
        })
        .catch(() => {
          setFallo(true)
          return false
        }),
    [],
  )

  const acciones = useMemo<AccionesRegistros>(
    () => ({
      agregarAgua: (fecha, ml) =>
        escribir(repositorios.registros.agregarAgua(fecha, ml), (actuales, agua) => ({
          ...actuales,
          aguas: [...actuales.aguas, agua],
        })),
      deshacerAgua: (fecha) => {
        const ultima = registros && ultimoDe(registros.aguas, fecha)
        if (!ultima) return Promise.resolve(false)
        return escribir(repositorios.registros.eliminarAgua(ultima.id), (actuales) => ({
          ...actuales,
          aguas: actuales.aguas.filter((agua) => agua.id !== ultima.id),
        }))
      },
      agregarEjercicio: (nuevo) =>
        escribir(repositorios.registros.agregarEjercicio(nuevo), (actuales, ejercicio) => ({
          ...actuales,
          ejercicios: [...actuales.ejercicios, ejercicio],
        })),
      eliminarEjercicio: (id) =>
        escribir(repositorios.registros.eliminarEjercicio(id), (actuales) => ({
          ...actuales,
          ejercicios: actuales.ejercicios.filter((ejercicio) => ejercicio.id !== id),
        })),
      deshacerEjercicio: (fecha) => {
        const ultimo = registros && ultimoDe(registros.ejercicios, fecha)
        if (!ultimo) return Promise.resolve(false)
        return escribir(repositorios.registros.eliminarEjercicio(ultimo.id), (actuales) => ({
          ...actuales,
          ejercicios: actuales.ejercicios.filter((ejercicio) => ejercicio.id !== ultimo.id),
        }))
      },
      guardarSueno: (fecha, minutos) =>
        escribir(repositorios.registros.guardarSueno({ fecha, minutos }), (actuales) => ({
          ...actuales,
          suenos: [...actuales.suenos.filter((sueno) => sueno.fecha !== fecha), { fecha, minutos }],
        })),
      agregarSiesta: (fecha, minutos) =>
        escribir(repositorios.registros.agregarSiesta(fecha, minutos), (actuales, siesta) => ({
          ...actuales,
          siestas: [...actuales.siestas, siesta],
        })),
      eliminarSiesta: (id) =>
        escribir(repositorios.registros.eliminarSiesta(id), (actuales) => ({
          ...actuales,
          siestas: actuales.siestas.filter((siesta) => siesta.id !== id),
        })),
    }),
    [escribir, registros],
  )

  return { hoy, estado, fallo, acciones }
}
