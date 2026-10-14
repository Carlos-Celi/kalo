import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { LIMITE_MENSAJES_POR_CHAT, MAXIMO_CHATS, mensajesEnviados, type Chat } from '../../domain/chats'

/** "hace 5 min" · "hace 3 h" · "ayer" · "12 oct" */
function haceCuanto(marca: number, ahora: number): string {
  const minutos = Math.max(Math.round((ahora - marca) / 60_000), 0)
  if (minutos < 1) return 'ahora'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  if (horas < 48) return 'ayer'
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(marca).replace('.', '')
}

interface Props {
  chats: Chat[]
  activoId: string | null
  ocupado: boolean
  /** Hay un chat en blanco abierto: no tiene sentido abrir otro. */
  enBlanco: boolean
  onNuevo: () => void
  onAbrir: (id: string) => void
  onBorrar: (id: string) => void
}

/** Lista de los últimos chats con el asistente y el botón de chat nuevo. */
export function HistorialChats({ chats, activoId, ocupado, enBlanco, onNuevo, onAbrir, onBorrar }: Props) {
  // Las etiquetas "hace 5 min" se refrescan cada minuto.
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 60_000)
    return () => clearInterval(reloj)
  }, [])
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <button
        type="button"
        disabled={ocupado || enBlanco}
        onClick={onNuevo}
        className="flex h-12 items-center justify-center gap-2 rounded-boton bg-brasa text-[15px] font-bold text-white hover:bg-brasa-hover disabled:opacity-50"
      >
        <Icon nombre="mas" tamano={18} grosor={2.4} />
        Chat nuevo
      </button>

      <h2 className="mt-1 text-xs font-bold tracking-[0.8px] text-ceniza uppercase">
        Historial · últimos {MAXIMO_CHATS}
      </h2>
      {chats.length === 0 ? (
        <p className="rounded-boton bg-muro px-3.5 py-3 text-xs leading-normal font-medium text-ceniza">
          Aquí aparecerán tus conversaciones. Se guardan solo en este dispositivo y se conservan las{' '}
          {MAXIMO_CHATS} más recientes.
        </p>
      ) : (
        <ul aria-label="Chats recientes" className="flex flex-col gap-1.5">
          {chats.map((chat) => {
            const activo = chat.id === activoId
            const enviados = mensajesEnviados(chat)
            return (
              <li
                key={chat.id}
                className={`flex items-center rounded-2xl ${
                  activo ? 'bg-banco ring-1 ring-llama' : 'hover:bg-muro'
                }`}
              >
                <button
                  type="button"
                  disabled={ocupado}
                  aria-current={activo ? 'true' : undefined}
                  onClick={() => onAbrir(chat.id)}
                  className="flex min-h-[56px] min-w-0 grow flex-col justify-center gap-0.5 rounded-2xl px-3 py-1.5 text-left disabled:opacity-60"
                >
                  <span className="truncate text-[13px] font-bold">{chat.titulo}</span>
                  <span className="text-xs font-medium text-ceniza">
                    {enviados}/{LIMITE_MENSAJES_POR_CHAT} mensajes · {haceCuanto(chat.actualizadoEn, ahora)}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={ocupado}
                  aria-label={`Eliminar el chat «${chat.titulo}»`}
                  onClick={() => onBorrar(chat.id)}
                  className="mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-ceniza hover:text-exceso disabled:opacity-60"
                >
                  <Icon nombre="papelera" tamano={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-auto text-xs leading-normal font-medium text-ceniza">
        Cada chat admite {LIMITE_MENSAJES_POR_CHAT} mensajes tuyos; después abre uno nuevo. Así la
        conversación se mantiene al día con tus registros.
      </p>
    </div>
  )
}
