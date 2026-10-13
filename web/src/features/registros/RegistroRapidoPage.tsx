import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { MascotAvatar } from '../../components/ui/MascotAvatar'
import { repositorios } from '../../data'
import { formatoDecimal, formatoDuracion, formatoEntero, formatoPeso } from '../../domain/formato'
import { totalesDelDia } from '../../domain/registros'
import { usePerfil } from '../perfil/contexto'
import { useRegistros } from './useRegistros'

interface MosaicoProps {
  to: string
  icono: NombreIcono
  nombre: string
  detalle: string
  clase: string
}

function Mosaico({ to, icono, nombre, detalle, clase }: MosaicoProps) {
  return (
    <Link
      to={to}
      className={`flex min-h-28 flex-col gap-2.5 rounded-tarjeta p-3.5 no-underline ${clase}`}
    >
      <Icon nombre={icono} tamano={26} />
      <span className="mt-auto">
        <span className="block text-base font-extrabold">{nombre}</span>
        <span className="block text-xs font-semibold">{detalle}</span>
      </span>
    </Link>
  )
}

/** Hoja "Registro rápido" (design/Mas.dc.html): accesos a todo lo que se puede registrar. */
export function RegistroRapidoPage() {
  useTitulo('Registro rápido')
  const navegar = useNavigate()
  const { perfil } = usePerfil()
  const { hoy, estado } = useRegistros(1)
  const [pesoKg, setPesoKg] = useState<number | null>(null)
  const dialogo = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let vigente = true
    repositorios.registros
      .obtenerPesoAnterior('9999-12-31')
      .then((peso) => {
        if (vigente && peso) setPesoKg(peso.kg)
      })
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [])

  // Escape cierra la hoja y Tab no sale de ella (el tab bar queda detrás del fondo).
  useEffect(() => {
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        void navegar(rutas.inicio)
        return
      }
      if (evento.key !== 'Tab' || !dialogo.current) return
      const enfocables = dialogo.current.querySelectorAll<HTMLElement>('a[href]:not([tabindex="-1"]), button:not([disabled])')
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      if (!primero || !ultimo) return
      const activo = document.activeElement
      if (!dialogo.current.contains(activo)) {
        evento.preventDefault()
        primero.focus()
      } else if (evento.shiftKey && activo === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [navegar])

  const metas = perfil.plan?.metas
  const totales = estado.fase === 'listo' ? totalesDelDia(estado.registros, hoy) : null
  const peso = pesoKg ?? perfil.plan?.datos.pesoKg

  return (
    // z-40: por encima del tab bar (z-20), que si no tapa la parte baja de la hoja.
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center">
      <Link
        to={rutas.inicio}
        aria-label="Cerrar registro rápido"
        tabIndex={-1}
        className="absolute inset-0 bg-tinta/55"
      />
      <div
        ref={dialogo}
        role="dialog"
        aria-modal="true"
        aria-labelledby="registro-rapido"
        className="relative flex w-full max-w-[480px] flex-col gap-3.5 rounded-t-[28px] bg-white px-4 pt-3.5 pb-[max(36px,env(safe-area-inset-bottom))] lg:rounded-[28px] lg:p-6"
      >
        <div aria-hidden="true" className="h-1 w-10 self-center rounded-sm bg-borde lg:hidden" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MascotAvatar tamano={44} />
            <div>
              <h1 id="registro-rapido" className="text-[22px] font-extrabold tracking-[-0.4px]">
                Registro rápido
              </h1>
              <p className="mt-0.5 text-[13px] text-tinta-3">¿Qué quieres registrar ahora?</p>
            </div>
          </div>
          <Link
            to={rutas.inicio}
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center rounded-full bg-crema text-kalo-oscuro"
          >
            <Icon nombre="cerrar" tamano={20} grosor={2} />
          </Link>
        </div>

        <Link
          to={rutas.camara}
          autoFocus
          className="flex items-center gap-3.5 rounded-[20px] bg-kalo p-4 text-white no-underline hover:bg-kalo-oscuro hover:text-white"
        >
          <span className="flex size-[52px] shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Icon nombre="camara" tamano={26} />
          </span>
          <span className="grow">
            <span className="block text-[17px] font-extrabold">Comida</span>
            <span className="block text-[13px] font-medium">Foto con IA o ingreso manual</span>
          </span>
          <Icon nombre="flechaAdelante" tamano={20} grosor={2} />
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Mosaico
            to={rutas.registrosAgua}
            icono="gota"
            nombre="Agua"
            detalle={
              totales && metas
                ? `${formatoDecimal(totales.aguaMl / 1000)} / ${formatoDecimal(metas.aguaL, 2)} L hoy`
                : 'Vasos y botellas'
            }
            clase="bg-agua-suave text-agua-fuerte hover:text-agua-fuerte"
          />
          <Mosaico
            to={rutas.registrosEjercicio}
            icono="mancuerna"
            nombre="Ejercicio"
            detalle={
              totales && metas
                ? `${formatoEntero(totales.ejercicioMin)} / ${formatoEntero(metas.ejercicioMin)} min`
                : 'Minutos de actividad'
            }
            clase="bg-ejercicio-boton text-ejercicio-fuerte hover:text-ejercicio-fuerte"
          />
          <Mosaico
            to={rutas.registrosSueno}
            icono="luna"
            nombre="Sueño"
            detalle={
              totales && totales.suenoMin > 0
                ? `${formatoDuracion(totales.suenoMin)} anoche`
                : 'Horas dormidas'
            }
            clase="bg-sueno-suave text-sueno hover:text-sueno"
          />
          <Mosaico
            to={rutas.peso}
            icono="bascula"
            nombre="Peso"
            detalle={peso ? `${formatoPeso(peso)} kg · para tus métricas` : 'Para tus métricas'}
            clase="bg-peso-fondo text-peso-texto hover:text-peso-texto"
          />
        </div>
      </div>
    </div>
  )
}
