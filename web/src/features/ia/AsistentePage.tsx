import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Alerta } from '../../components/ui/Alerta'
import { Icon } from '../../components/ui/Icon'
import { MascotAvatar } from '../../components/ui/MascotAvatar'
import { Markdown } from '../../components/ui/Markdown'
import { repositorios } from '../../data'
import {
  chatLleno,
  LIMITE_CONSULTA,
  LIMITE_MENSAJES_POR_CHAT,
  mensajesEnviados,
  tituloDeChat,
  type Chat,
  type TurnoChat,
} from '../../domain/chats'
import { contextoDeLaApp } from '../../domain/contextoAsistente'
import { claveDia, sumarDias } from '../../domain/fechas'
import { formatoEntero } from '../../domain/formato'
import {
  AVISO_MEDICO,
  ErrorIA,
  mensajeDeFalloIA,
  partirRespuesta,
  promptDelAsistente,
  saludoDelAsistente,
  SUGERENCIAS_DE_CONSULTA,
  type SugerenciaComida,
} from '../../domain/ia'
import type { Plan } from '../../domain/perfil'
import type { Recordatorio } from '../../domain/recordatorios'
import { siguienteComida, totalesDelDia } from '../../domain/registros'
import { usePerfil } from '../perfil/contexto'
import type { BorradorComida } from '../registros/comidaBorrador'
import { useRecordatorios } from '../recordatorios/almacen'
import { useRegistros } from '../registros/useRegistros'
import { useConfigIA } from './config'
import { HistorialChats } from './HistorialChats'
import { useChats } from './almacenChats'

const numero = (valor: number) => String(valor).replace('.', ',')
const ahoraMs = () => Date.now()

/** Instrucciones con todo lo que hay en la app en este momento. */
async function promptConDatos(plan: Plan, recordatorios: Recordatorio[]): Promise<string> {
  const ahora = new Date()
  const dia = claveDia(ahora)
  const desde = sumarDias(dia, -29)
  const [registros, resumen, pesos] = await Promise.all([
    repositorios.registros.obtenerRango(desde, dia),
    repositorios.registros.obtenerResumenDiario(desde, dia),
    repositorios.registros.obtenerPesos(sumarDias(dia, -90)),
  ])
  return promptDelAsistente(
    plan,
    contextoDeLaApp({ ahora, hoy: dia, plan, registros, resumen, pesos, recordatorios }),
  )
}

function nuevoId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}

/** Asistente nutriólogo (design/Asistente.dc.html): ocupa toda la pantalla, con historial de chats. */
export function AsistentePage() {
  useTitulo('Asistente')
  const { perfil } = usePerfil()
  const { config, cliente: obtenerCliente } = useConfigIA()
  const { recordatorios } = useRecordatorios()
  const { hoy, estado } = useRegistros(1)
  const { chats, guardar, borrar } = useChats()

  // Al entrar se retoma el chat más reciente; sin ninguno, se empieza en blanco.
  const [activoId, setActivoId] = useState<string | null>(() => chats[0]?.id ?? null)
  const [borrador, setBorrador] = useState('')
  const [enCurso, setEnCurso] = useState<string | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [verHistorial, setVerHistorial] = useState(false)
  // Lo único que anuncia el lector de pantalla: no el texto que va llegando, sino el estado.
  const [anuncio, setAnuncio] = useState('')
  const cancelar = useRef<AbortController | null>(null)
  const final = useRef<HTMLDivElement>(null)
  const cajaTexto = useRef<HTMLTextAreaElement>(null)

  const activo = chats.find((chat) => chat.id === activoId) ?? null
  const turnos = activo?.turnos ?? []

  useEffect(() => {
    final.current?.scrollIntoView?.({ block: 'end' })
  }, [turnos.length, enCurso, activoId])

  // Al salir de la pantalla se corta la respuesta que estuviera llegando.
  useEffect(() => () => cancelar.current?.abort(), [])

  // La caja de texto crece con lo que se escribe, hasta un límite.
  useEffect(() => {
    const caja = cajaTexto.current
    if (!caja) return
    caja.style.height = 'auto'
    caja.style.height = `${Math.min(caja.scrollHeight, 160)}px`
  }, [borrador])

  const plan = perfil.plan
  if (!plan) return null

  const registros = estado.fase === 'listo' ? estado.registros : null
  const totales = registros ? totalesDelDia(registros, hoy) : null
  const ocupado = enCurso !== null
  const lleno = chatLleno(activo)
  const enviados = mensajesEnviados(activo)
  const puedeEnviar = config !== null && !ocupado && !lleno

  async function preguntar(consulta: string) {
    const texto = consulta.trim().slice(0, LIMITE_CONSULTA)
    if (!texto || !config || !plan || ocupado || lleno) return
    const ahora = ahoraMs()
    const base: Chat = activo ?? {
      id: nuevoId(),
      titulo: tituloDeChat(texto),
      creadoEn: ahora,
      actualizadoEn: ahora,
      turnos: [],
    }
    const pregunta: TurnoChat = { rol: 'usuario', texto, visible: texto, sugerencias: [] }
    const historial = [...base.turnos, pregunta]
    guardar({ ...base, turnos: historial, actualizadoEn: ahora })
    setActivoId(base.id)
    setVerHistorial(false)
    setBorrador('')
    setFallo(null)
    setEnCurso('')
    setAnuncio('El asistente está respondiendo…')
    const control = new AbortController()
    cancelar.current = control
    try {
      const sistema = await promptConDatos(plan, recordatorios)
      const cliente = await obtenerCliente()
      const respuesta = await cliente.conversar(
        config.modelo,
        sistema,
        historial.map(({ rol, texto: enviado }) => ({ rol, texto: enviado })),
        (acumulado) => setEnCurso(partirRespuesta(acumulado).visible),
        control.signal,
      )
      const { visible, sugerencias } = partirRespuesta(respuesta)
      guardar({
        ...base,
        turnos: [...historial, { rol: 'asistente', texto: respuesta, visible, sugerencias }],
        actualizadoEn: ahoraMs(),
      })
      setAnuncio('Respuesta del asistente lista.')
    } catch (error) {
      setAnuncio('')
      if (control.signal.aborted) return
      // La pregunta sin respuesta se retira para que el historial siga alternando turnos.
      if (base.turnos.length === 0) borrar(base.id)
      else guardar({ ...base, actualizadoEn: ahora })
      setBorrador(texto)
      setFallo(mensajeDeFalloIA[error instanceof ErrorIA ? error.motivo : 'desconocido'])
    } finally {
      if (cancelar.current === control) {
        cancelar.current = null
        setEnCurso(null)
      }
    }
  }

  function nuevoChat() {
    if (ocupado) return
    setActivoId(null)
    setBorrador('')
    setFallo(null)
    setVerHistorial(false)
    cajaTexto.current?.focus()
  }

  function abrirChat(id: string) {
    if (ocupado) return
    setActivoId(id)
    setFallo(null)
    setVerHistorial(false)
  }

  function borrarChat(id: string) {
    borrar(id)
    if (id === activoId) setActivoId(null)
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    void preguntar(borrador)
  }

  function alTeclear(evento: KeyboardEvent<HTMLTextAreaElement>) {
    // Intro envía; Mayús + Intro añade una línea.
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault()
      void preguntar(borrador)
    }
  }

  function prefill(sugerencia: SugerenciaComida): BorradorComida {
    return {
      tipo: registros ? siguienteComida(registros, hoy) : 'snack',
      nombre: sugerencia.nombre,
      porcion: '',
      kcal: numero(Math.round(sugerencia.kcal)),
      proteinaG: numero(sugerencia.proteina_g),
      carbohidratosG: numero(sugerencia.carbohidratos_g),
      azucarG: numero(sugerencia.azucar_g),
      grasaG: numero(sugerencia.grasa_g),
      esAlcohol: false,
      gradosAlcohol: '',
    }
  }

  const burbuja = (rol: TurnoChat['rol']) =>
    rol === 'usuario'
      ? 'rounded-[20px_20px_6px_20px] bg-brasa text-white'
      : 'rounded-[20px_20px_20px_6px] border border-filo bg-muro text-hueso'

  const historialProps = {
    chats,
    activoId,
    ocupado,
    enBlanco: activo === null && turnos.length === 0,
    onNuevo: nuevoChat,
    onAbrir: abrirChat,
    onBorrar: borrarChat,
  }

  return (
    <div className="flex h-full min-h-0 bg-muro">
      <aside
        aria-label="Historial de chats"
        className="hidden w-[300px] shrink-0 border-r border-filo bg-muro lg:block"
      >
        <HistorialChats {...historialProps} />
      </aside>

      <section aria-label="Asistente Kalo" className="relative flex min-w-0 grow flex-col">
        <header className="flex items-center gap-3 border-b border-filo bg-muro px-4 py-3 lg:px-8">
          <MascotAvatar tamano={44} alt="Mascota de Kalo" />
          <div className="min-w-0 grow">
            <h1 className="truncate text-xl font-extrabold tracking-[-0.4px]">Asistente Kalo</h1>
            <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-ceniza">
              <span
                aria-hidden="true"
                className={`size-2 shrink-0 rounded-full ${config ? 'bg-llama' : 'bg-filo'}`}
              />
              {config ? `Nutriólogo IA · ${config.nombreModelo}` : 'Nutriólogo IA · sin conectar'}
            </div>
          </div>
          <button
            type="button"
            aria-label="Chat nuevo"
            disabled={ocupado || (activo === null && turnos.length === 0)}
            onClick={nuevoChat}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brasa text-white hover:bg-brasa-hover disabled:opacity-50 lg:hidden"
          >
            <Icon nombre="mas" tamano={20} grosor={2.4} />
          </button>
          <button
            type="button"
            aria-label="Historial de chats"
            aria-expanded={verHistorial}
            onClick={() => setVerHistorial((actual) => !actual)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-filo text-hueso hover:bg-muro lg:hidden"
          >
            <Icon nombre="reloj" tamano={20} />
          </button>
          {/* En móvil este acceso vive al pie del historial, para que la cabecera quepa en una línea. */}
          <Link
            to={rutas.proveedorIA}
            aria-label="Configurar proveedor de IA"
            className="hidden size-11 shrink-0 items-center justify-center rounded-full border border-filo text-hueso hover:bg-muro lg:flex"
          >
            <Icon nombre="ajustes" tamano={20} />
          </Link>
        </header>

        <div className="relative flex min-h-0 grow flex-col">
        {verHistorial && (
          <div className="absolute inset-0 z-10 flex flex-col overflow-y-auto bg-muro lg:hidden">
            <div className="min-h-0 grow">
              <HistorialChats {...historialProps} />
            </div>
            <Link
              to={rutas.proveedorIA}
              className="mx-4 mb-4 flex h-12 shrink-0 items-center justify-center gap-2 rounded-boton border border-filo text-sm font-bold text-hueso no-underline hover:bg-muro"
            >
              <Icon nombre="ajustes" tamano={18} />
              Configurar proveedor de IA
            </Link>
          </div>
        )}

        {/* Sin `role="log"` ni `aria-live`: la respuesta llega en trozos y se leería una y otra vez. */}
        <div
          role="region"
          aria-label="Conversación"
          tabIndex={0}
          className="min-h-0 grow overflow-y-auto bg-sala px-4 py-5 lg:px-8"
        >
          <p role="status" className="sr-only">
            {anuncio}
          </p>
          <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3.5">
            <p className="flex items-center gap-2 self-center rounded-full bg-banco px-3.5 py-2 text-center text-xs leading-normal font-semibold text-llama">
              <Icon nombre="escudo" tamano={16} className="shrink-0" />
              {AVISO_MEDICO}
            </p>

            {totales && (
              <div className="self-center rounded-full bg-banco px-3 py-1 text-xs font-semibold text-ceniza">
                Hoy: {formatoEntero(totales.kcal)} kcal · {formatoEntero(totales.proteinaG)} g de proteína
              </div>
            )}
            {totales && (
              <div className={`max-w-[92%] px-4 py-3 text-[15px] leading-relaxed font-medium lg:max-w-[75%] ${burbuja('asistente')}`}>
                {saludoDelAsistente(perfil.nombre, totales, plan)}
              </div>
            )}

            {!config && (
              <div className="flex flex-col items-start gap-2.5 rounded-2xl bg-peso-luz/15 p-4 text-[13px] leading-normal font-semibold text-peso-luz">
                Para conversar con el asistente, conecta tu proveedor de IA con tu propia API key.
                <Link
                  to={rutas.proveedorIA}
                  className="flex h-11 items-center rounded-full bg-brasa px-4 text-[13px] font-bold text-white no-underline hover:bg-brasa-hover hover:text-white"
                >
                  Configurar la IA
                </Link>
              </div>
            )}

            {config && turnos.length === 0 && !ocupado && (
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGERENCIAS_DE_CONSULTA.map((consulta) => (
                  <button
                    key={consulta}
                    type="button"
                    disabled={!puedeEnviar}
                    onClick={() => void preguntar(consulta)}
                    className="flex min-h-12 items-center gap-2 rounded-2xl border border-filo bg-muro px-3.5 py-2 text-left text-[13px] font-bold text-hueso hover:border-llama hover:bg-muro disabled:opacity-50"
                  >
                    <Icon nombre="destello" tamano={16} grosor={2} className="shrink-0 text-llama" />
                    {consulta}
                  </button>
                ))}
              </div>
            )}

            {turnos.map((turno, i) => (
              <div
                key={i}
                className={`flex max-w-[92%] animate-aparecer flex-col gap-2 lg:max-w-[75%] ${turno.rol === 'usuario' ? 'self-end' : 'self-start'}`}
              >
                <div className={`px-4 py-3 text-[15px] leading-relaxed font-medium ${burbuja(turno.rol)}`}>
                  <span className="sr-only">{turno.rol === 'usuario' ? 'Tú: ' : 'Asistente: '}</span>
                  {turno.rol === 'usuario' ? (
                    <span className="whitespace-pre-wrap">{turno.visible}</span>
                  ) : (
                    <Markdown texto={turno.visible} />
                  )}
                </div>
                {turno.sugerencias.map((sugerencia) => (
                  <div
                    key={sugerencia.nombre}
                    className="flex items-center gap-2.5 rounded-2xl border border-filo bg-muro px-3.5 py-2.5"
                  >
                    <span className="flex min-w-0 grow flex-col">
                      <span className="text-[13px] font-bold">{sugerencia.nombre}</span>
                      <span className="text-xs font-medium text-ceniza">
                        {formatoEntero(sugerencia.kcal)} kcal · {formatoEntero(sugerencia.proteina_g)} g de proteína
                      </span>
                    </span>
                    <Link
                      to={`${rutas.comidaManual}?fecha=${hoy}`}
                      state={{ prefill: prefill(sugerencia) }}
                      aria-label={`Registrar ${sugerencia.nombre}`}
                      className="flex h-11 shrink-0 items-center rounded-full bg-banco px-4 text-xs font-bold text-llama no-underline hover:bg-banco"
                    >
                      Registrar
                    </Link>
                  </div>
                ))}
              </div>
            ))}

            {ocupado && (
              <div
                aria-hidden="true"
                className={`max-w-[92%] self-start px-4 py-3 text-[15px] leading-relaxed font-medium lg:max-w-[75%] ${burbuja('asistente')}`}
              >
                {enCurso ? (
                  <Markdown texto={enCurso} />
                ) : (
                  <span className="flex items-center gap-1.5 py-1">
                    <span className="sr-only">Revisando tus datos…</span>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        aria-hidden="true"
                        className="size-2 animate-punto rounded-full bg-llama"
                        style={{ animationDelay: `${i * 0.16}s` }}
                      />
                    ))}
                  </span>
                )}
              </div>
            )}

            {fallo && (
              <Alerta titulo="El asistente no pudo responder">{fallo}</Alerta>
            )}
            {lleno && (
              <div
                role="status"
                className="flex flex-col items-start gap-2.5 rounded-2xl bg-peso-luz/15 p-4 text-[13px] leading-normal font-semibold text-peso-luz"
              >
                Este chat llegó al límite de {LIMITE_MENSAJES_POR_CHAT} mensajes. Abre uno nuevo para
                seguir: el asistente volverá a leer tus registros al día.
                <button
                  type="button"
                  onClick={nuevoChat}
                  className="flex h-11 items-center gap-2 rounded-full bg-brasa px-4 text-[13px] font-bold text-white"
                >
                  <Icon nombre="mas" tamano={16} grosor={2.4} />
                  Abrir un chat nuevo
                </button>
              </div>
            )}
            <div ref={final} />
          </div>
        </div>

        <div className="border-t border-filo bg-muro px-4 pt-3 pb-3 lg:px-8">
          <div className="mx-auto flex w-full max-w-[820px] flex-col gap-2.5">
            {turnos.length > 0 && !lleno && (
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5">
                {SUGERENCIAS_DE_CONSULTA.slice(0, 4).map((consulta) => (
                  <button
                    key={consulta}
                    type="button"
                    disabled={!puedeEnviar}
                    onClick={() => void preguntar(consulta)}
                    className="h-11 shrink-0 rounded-full border border-filo bg-muro px-3.5 text-xs font-semibold whitespace-nowrap text-hueso hover:bg-muro disabled:opacity-50"
                  >
                    {consulta}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={enviar}
              className="flex items-end gap-2 rounded-[26px] border border-filo bg-muro py-1.5 pr-1.5 pl-4 focus-within:border-llama focus-within:bg-muro"
            >
              <label htmlFor="consulta" className="sr-only">
                Escribe tu consulta
              </label>
              <textarea
                id="consulta"
                ref={cajaTexto}
                rows={1}
                autoComplete="off"
                maxLength={LIMITE_CONSULTA}
                placeholder={
                  lleno ? 'Abre un chat nuevo para seguir' : 'Pregunta sobre tu alimentación, tu menú, tu progreso…'
                }
                value={borrador}
                disabled={!config || lleno}
                onChange={(evento) => setBorrador(evento.target.value)}
                onKeyDown={alTeclear}
                className="max-h-40 min-h-[44px] min-w-0 grow resize-none border-0 bg-transparent py-[11px] text-[15px] leading-snug font-medium text-hueso outline-none"
              />
              <button
                type="submit"
                aria-label="Enviar"
                disabled={!puedeEnviar || !borrador.trim()}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brasa text-white hover:bg-brasa-hover disabled:opacity-50"
              >
                <Icon nombre="enviar" tamano={20} grosor={2.2} />
              </button>
            </form>

            <div className="flex items-center gap-3 px-1 text-xs font-medium text-ceniza">
              <span aria-hidden="true" className="hidden sm:inline">
                Intro envía · Mayús + Intro, nueva línea
              </span>
              <span className="ml-auto" aria-label={`${enviados} de ${LIMITE_MENSAJES_POR_CHAT} mensajes en este chat`}>
                {enviados}/{LIMITE_MENSAJES_POR_CHAT} mensajes
              </span>
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  )
}
