import { Link, useSearchParams } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Alerta } from '../../components/ui/Alerta'
import { ErrorCarga } from '../../components/ui/ErrorCarga'
import { Icon } from '../../components/ui/Icon'
import { esClaveDia, formatoDiaRelativo, ultimosDias, type ClaveDia } from '../../domain/fechas'
import {
  avanceDe,
  estadoDe,
  racha,
  SECCIONES,
  totalesDelDia,
  type Seccion,
} from '../../domain/registros'
import { usePerfil } from '../perfil/contexto'
import { DetalleAgua, DetalleComida, DetalleEjercicio, DetalleSueno } from './Detalles'
import { secciones } from './secciones'
import { SemanaAnillos, type DiaSemana } from './SemanaAnillos'
import { useRegistros } from './useRegistros'

/** Días que se cargan: la semana visible y margen para contar la racha. */
const DIAS_CARGADOS = 30

const detalles = {
  comida: DetalleComida,
  agua: DetalleAgua,
  ejercicio: DetalleEjercicio,
  sueno: DetalleSueno,
}

function textoRacha(dias: number, hoyCumplido: boolean): { titulo: string; detalle: string } {
  const tocar = 'Toca un día para ver su detalle.'
  if (dias === 0) return { titulo: 'Enciende tu racha', detalle: `Cumple hoy tu meta para empezar. ${tocar}` }
  const titulo = dias === 1 ? 'Racha de 1 día encendida' : `Racha de ${dias} días encendida`
  return {
    titulo,
    detalle: hoyCumplido ? `¡Hoy ya cumpliste! ${tocar}` : `Cumple hoy tu meta para llegar a ${dias + 1}. ${tocar}`,
  }
}

/** Hub de registros (design/Registros.dc.html): una sección activa, su semana y el detalle del día. */
export function RegistrosPage({ seccion }: { seccion: Seccion }) {
  const estilo = secciones[seccion]
  useTitulo(`Registros · ${estilo.nombre}`)
  const { perfil } = usePerfil()
  const { hoy, estado, fallo, acciones } = useRegistros(DIAS_CARGADOS)
  const [parametros, setParametros] = useSearchParams()

  const pedida = parametros.get('fecha') ?? ''
  const semana = ultimosDias(hoy, 7)
  const fecha: ClaveDia = esClaveDia(pedida) && semana.includes(pedida) ? pedida : hoy
  const busqueda = fecha === hoy ? '' : `?fecha=${fecha}`

  const metas = perfil.plan?.metas
  if (!metas) return null

  function seleccionar(dia: ClaveDia) {
    setParametros(dia === hoy ? {} : { fecha: dia }, { replace: true })
  }

  const cabecera = (
    <>
      <div className="flex items-center justify-between">
        <h1 className="num-marcador text-[40px] leading-[0.9] font-extrabold uppercase lg:text-[48px]">
          Registros
        </h1>
        {/* Solo informa el día elegido: sin borde de botón para no parecer un selector. */}
        <span className="flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-ceniza">
          <Icon nombre="calendario" tamano={16} />
          {formatoDiaRelativo(fecha, hoy)}
        </span>
      </div>
      <nav
        aria-label="Sección de registros"
        className="grid grid-cols-4 gap-1 rounded-boton-sm bg-muro p-1"
      >
        {SECCIONES.map((otra) => {
          const activa = otra === seccion
          return (
            <Link
              key={otra}
              to={`${secciones[otra].ruta}${busqueda}`}
              aria-current={activa ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[9px] text-xs font-semibold no-underline ${
                activa ? 'bg-hueso text-tinta' : 'text-ceniza hover:text-hueso'
              }`}
            >
              <Icon nombre={secciones[otra].icono} tamano={20} />
              {secciones[otra].nombre}
            </Link>
          )
        })}
      </nav>
    </>
  )

  if (estado.fase !== 'listo') {
    return (
      <div className="flex flex-col gap-3.5">
        {cabecera}
        {estado.fase === 'cargando' ? (
          <p role="status" className="py-10 text-center text-sm font-medium text-ceniza">
            Cargando tus registros…
          </p>
        ) : (
          <ErrorCarga mensaje="No pudimos cargar tus registros." />
        )}
      </div>
    )
  }

  const { registros } = estado
  const estadoDelDia = (dia: ClaveDia) => {
    const avance = avanceDe(seccion, totalesDelDia(registros, dia), metas)
    return { avance, estado: estadoDe(seccion, avance) }
  }
  const dias: DiaSemana[] = semana.map((dia) => {
    const { avance, estado: estadoDia } = estadoDelDia(dia)
    return {
      fecha: dia,
      porcentaje: avance.meta > 0 ? Math.round((avance.valor / avance.meta) * 100) : 0,
      estado: estadoDia,
    }
  })
  const estados = ultimosDias(hoy, DIAS_CARGADOS).map((dia) => estadoDelDia(dia).estado)
  const mensajeRacha = textoRacha(racha(estados), estados.at(-1) === 'cumplido')
  const Detalle = detalles[seccion]
  const esHoy = fecha === hoy

  return (
    <div className="flex flex-col gap-3.5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
      <div className="flex flex-col gap-3.5 lg:col-span-5">
        {cabecera}
        <SemanaAnillos
          seccion={seccion}
          dias={dias}
          hoy={hoy}
          seleccionado={fecha}
          onSeleccionar={seleccionar}
          metas={metas}
          racha={mensajeRacha}
        />
      </div>

      <div className="flex flex-col gap-3.5 lg:col-span-7">
        <div className="flex min-h-10 items-center justify-between pt-0.5">
          <h2 className="text-[17px] font-extrabold tracking-[-0.3px]">
            {estilo.tituloDetalle(esHoy)}
          </h2>
          {seccion === 'comida' && (
            <Link
              to={`${rutas.camara}${busqueda}`}
              className="flex h-11 items-center gap-1.5 rounded-full bg-brasa px-3.5 text-[13px] font-bold text-white no-underline hover:bg-brasa-hover hover:text-white"
            >
              <Icon nombre="mas" tamano={16} grosor={2.4} />
              Registrar
            </Link>
          )}
        </div>
        {fallo && (
          <Alerta titulo="No pudimos guardar el último cambio">
            No se ha registrado. Revisa tu conexión y vuelve a pulsarlo; lo demás está guardado.
          </Alerta>
        )}
        <Detalle
          registros={registros}
          fecha={fecha}
          hoy={hoy}
          esHoy={esHoy}
          metas={metas}
          acciones={acciones}
          semana={semana}
          onSeleccionar={seleccionar}
        />
      </div>
    </div>
  )
}
