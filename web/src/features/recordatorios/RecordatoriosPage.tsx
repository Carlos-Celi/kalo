import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Alerta } from '../../components/ui/Alerta'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { Interruptor } from '../../components/ui/Interruptor'
import {
  LIMITE_NOMBRE_RECORDATORIO,
  MAXIMO_RECORDATORIOS,
  type Recordatorio,
} from '../../domain/recordatorios'
import { useAuth } from '../auth/contexto'
import { FilaRecordatorio } from './FilaRecordatorio'
import {
  pedirPermisoDeAvisos,
  permisoDeAvisos,
  useAvisosPorCorreo,
  useRecordatorios,
  type PermisoAvisos,
} from './almacen'

const DIAS: { dia: number; letra: string; nombre: string }[] = [
  { dia: 1, letra: 'L', nombre: 'Lunes' },
  { dia: 2, letra: 'M', nombre: 'Martes' },
  { dia: 3, letra: 'X', nombre: 'Miércoles' },
  { dia: 4, letra: 'J', nombre: 'Jueves' },
  { dia: 5, letra: 'V', nombre: 'Viernes' },
  { dia: 6, letra: 'S', nombre: 'Sábado' },
  { dia: 0, letra: 'D', nombre: 'Domingo' },
]

const mensajePermiso: Record<Exclude<PermisoAvisos, 'concedido'>, string> = {
  pendiente: 'Permite las notificaciones de Kalo en este navegador para recibirlas.',
  denegado:
    'Las notificaciones están bloqueadas en este navegador. Actívalas desde los permisos del sitio.',
  'no-disponible': 'Este navegador no admite notificaciones.',
}

function Canal({
  icono,
  titulo,
  detalle,
  children,
}: {
  icono: NombreIcono
  titulo: string
  detalle: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 rounded-tarjeta border border-filo bg-muro p-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banco text-llama">
        <Icon nombre={icono} tamano={20} />
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="text-sm font-extrabold">{titulo}</span>
        <span className="text-xs leading-normal font-medium text-ceniza">{detalle}</span>
      </span>
      {children}
    </div>
  )
}

/** Recordatorios (design/Recordatorios.dc.html): activar, desactivar, crear avisos propios y elegir dónde llegan. */
export function RecordatoriosPage() {
  useTitulo('Recordatorios')
  const auth = useAuth()
  const { recordatorios, guardar, alternar } = useRecordatorios()
  const correo = useAvisosPorCorreo()
  const [permiso, setPermiso] = useState(permisoDeAvisos)
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [hora, setHora] = useState('09:00')
  const [dias, setDias] = useState<number[]>(DIAS.map(({ dia }) => dia))
  const [error, setError] = useState<string | null>(null)

  const activos = recordatorios.filter((recordatorio) => recordatorio.activo).length
  const lleno = recordatorios.length >= MAXIMO_RECORDATORIOS
  const direccion = auth.fase === 'autenticado' ? auth.usuario.correo : null

  async function pedirPermiso() {
    setPermiso(await pedirPermisoDeAvisos())
  }

  function alAlternar(recordatorio: Recordatorio) {
    alternar(recordatorio.id)
    // Al activar el primero se pide el permiso, aprovechando el gesto del usuario.
    if (!recordatorio.activo && permiso === 'pendiente') void pedirPermiso()
  }

  function crear(evento: FormEvent) {
    evento.preventDefault()
    const limpio = nombre.trim()
    if (!limpio) return setError('Escribe un nombre.')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return setError('Elige una hora.')
    if (dias.length === 0) return setError('Elige al menos un día.')
    guardar([
      ...recordatorios,
      { id: `propio-${Date.now()}`, tipo: 'propio', nombre: limpio, horas: [hora], dias, activo: true },
    ])
    setCreando(false)
    setNombre('')
    setError(null)
    if (permiso === 'pendiente') void pedirPermiso()
  }

  return (
    <div className="flex max-w-[880px] flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <Link
          to={rutas.ajustes}
          aria-label="Volver a Configuración"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-banco text-hueso hover:bg-filo"
        >
          <Icon nombre="flechaAtras" tamano={20} grosor={2} />
        </Link>
        <h1 className="grow num-marcador text-[40px] leading-[0.9] font-extrabold uppercase lg:text-[48px]">
          Recordatorios
        </h1>
        <button
          type="button"
          aria-label="Nuevo recordatorio"
          aria-expanded={creando}
          disabled={lleno}
          onClick={() => setCreando((actual) => !actual)}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brasa text-white hover:bg-brasa-hover disabled:opacity-50"
        >
          <Icon nombre={creando ? 'cerrar' : 'mas'} tamano={20} grosor={2.2} />
        </button>
      </div>

      <section aria-labelledby="canales" className="flex flex-col gap-2.5">
        <h2 id="canales" className="text-xs font-bold tracking-[0.8px] text-ceniza uppercase">
          Dónde te avisamos
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Canal
            icono="campana"
            titulo="En este navegador"
            detalle={
              permiso === 'concedido'
                ? 'Notificaciones activadas. Llegan mientras Kalo esté abierto.'
                : mensajePermiso[permiso]
            }
          >
            {permiso === 'pendiente' && (
              <Button variante="suave" onClick={() => void pedirPermiso()}>
                Permitir
              </Button>
            )}
            {permiso === 'concedido' && (
              <span className="shrink-0 rounded-md bg-llama/15 px-2 py-[3px] text-xs font-bold text-llama">
                Activas
              </span>
            )}
          </Canal>

          <Canal
            icono="sobre"
            titulo="Por correo"
            detalle={
              !correo.disponible
                ? 'Disponible con una cuenta: inicia sesión para recibir los avisos en tu correo.'
                : correo.estado.fase === 'error'
                  ? 'No pudimos consultar este ajuste. Recarga la página.'
                  : direccion
                    ? `Te escribimos a ${direccion} a la hora de cada recordatorio, aunque Kalo esté cerrado.`
                    : 'Te escribimos a tu correo a la hora de cada recordatorio.'
            }
          >
            {correo.disponible && correo.estado.fase === 'listo' && (
              <Interruptor
                etiqueta="Recibir recordatorios por correo"
                activo={correo.estado.activo}
                onCambio={() => correo.cambiar(!(correo.estado.fase === 'listo' && correo.estado.activo))}
              />
            )}
          </Canal>
        </div>
        {correo.fallo && (
          <Alerta titulo="No pudimos guardar el aviso por correo">
            Sigue como estaba. Revisa tu conexión y vuelve a intentarlo.
          </Alerta>
        )}
      </section>

      {creando && (
        <form
          noValidate
          onSubmit={crear}
          aria-label="Nuevo recordatorio"
          className="flex flex-col gap-3 rounded-tarjeta border-[1.5px] border-llama bg-muro p-4"
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
            <label className="flex flex-col gap-2 text-[13px] font-semibold">
              Nombre
              <input
                type="text"
                autoFocus
                maxLength={LIMITE_NOMBRE_RECORDATORIO}
                placeholder="Tomar vitaminas, estirar…"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                className="h-12 rounded-boton border border-filo bg-muro px-3.5 text-[15px] font-medium text-hueso"
              />
            </label>
            <label className="flex flex-col gap-2 text-[13px] font-semibold">
              Hora
              <input
                type="time"
                value={hora}
                onChange={(evento) => setHora(evento.target.value)}
                className="h-12 rounded-boton border border-filo bg-muro px-3 text-[15px] font-medium text-hueso"
              />
            </label>
          </div>
          <div role="group" aria-label="Días" className="flex flex-wrap gap-1.5">
            {DIAS.map(({ dia, letra, nombre: nombreDia }) => (
              <Chip
                key={dia}
                seleccionado={dias.includes(dia)}
                onClick={() =>
                  setDias((actuales) =>
                    actuales.includes(dia) ? actuales.filter((otro) => otro !== dia) : [...actuales, dia],
                  )
                }
              >
                <span aria-hidden="true">{letra}</span>
                <span className="sr-only">{nombreDia}</span>
              </Chip>
            ))}
          </div>
          {error && (
            <Alerta titulo="Revisa el recordatorio">{error}</Alerta>
          )}
          <Button type="submit" tamano="lg" className="md:self-end md:px-8">
            Guardar recordatorio
          </Button>
        </form>
      )}

      <h2 className="text-xs font-bold tracking-[0.8px] text-ceniza uppercase">
        {activos} de {recordatorios.length} activos
      </h2>
      <ul aria-label="Recordatorios" className="rounded-tarjeta border border-filo bg-muro px-3.5">
        {recordatorios.map((recordatorio) => (
          <FilaRecordatorio
            key={recordatorio.id}
            recordatorio={recordatorio}
            onAlternar={() => alAlternar(recordatorio)}
            onBorrar={
              recordatorio.tipo === 'propio'
                ? () => guardar(recordatorios.filter((otro) => otro.id !== recordatorio.id))
                : undefined
            }
          />
        ))}
      </ul>

      <div className="flex gap-2.5 rounded-2xl bg-banco p-3.5 text-xs leading-normal font-semibold text-llama">
        <Icon nombre="destello" tamano={18} grosor={2} className="shrink-0" />
        <p>
          Avisos inteligentes: no te avisamos si ya registraste esa comida, llegaste a tu meta de agua o
          ya hiciste tu ejercicio. Las horas son las de tu zona horaria.
        </p>
      </div>
    </div>
  )
}
