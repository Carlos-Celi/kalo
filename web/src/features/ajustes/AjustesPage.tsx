import { useState } from 'react'
import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Button } from '../../components/ui/Button'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { formatoDecimal, formatoDuracion, formatoEntero } from '../../domain/formato'
import { proveedores } from '../../domain/ia'
import { cerrarSesion } from '../auth/acciones'
import { useAuth } from '../auth/contexto'
import { useConfigIA } from '../ia/config'
import { usePerfil } from '../perfil/contexto'
import { useAvisosPorCorreo, useRecordatorios } from '../recordatorios/almacen'
import { FilaRecordatorio } from '../recordatorios/FilaRecordatorio'

const claseSeccion = 'text-xs font-bold tracking-[0.8px] text-tinta-3 uppercase'
const claseTarjeta = 'sombra-suave rounded-tarjeta border border-borde bg-white px-3.5'

interface FilaProps {
  ruta: string
  icono: NombreIcono
  nombre: string
  valor?: string
}

/** Fila que lleva a una pantalla de edición. */
function Fila({ ruta, icono, nombre, valor }: FilaProps) {
  return (
    <li className="border-b border-divisor last:border-b-0">
      <Link
        to={ruta}
        className="flex min-h-[52px] items-center gap-3 rounded-xl text-tinta no-underline hover:bg-crema-suave"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-crema text-kalo">
          <Icon nombre={icono} tamano={18} />
        </span>
        <span className="grow text-sm font-semibold">{nombre}</span>
        {valor && <span className="text-sm font-extrabold">{valor}</span>}
        <Icon nombre="flechaAdelante" tamano={16} grosor={2} className="text-tinta-3" />
      </Link>
    </li>
  )
}

/** Configuración (design/Ajustes.dc.html): perfil, metas, IA, recordatorios y cuenta. */
export function AjustesPage() {
  useTitulo('Configuración')
  const auth = useAuth()
  const { perfil } = usePerfil()
  const { config } = useConfigIA()
  const { recordatorios, alternar } = useRecordatorios()
  const correo = useAvisosPorCorreo()
  const [saliendo, setSaliendo] = useState(false)

  async function salir() {
    setSaliendo(true)
    await cerrarSesion().catch(() => undefined)
    setSaliendo(false)
  }

  const plan = perfil.plan
  if (!plan) return null
  const { datos, metas } = plan
  const correoActivo = correo.estado.fase === 'listo' && correo.estado.activo

  return (
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8 lg:gap-y-6">
      <h1 className="text-2xl font-extrabold tracking-[-0.5px] lg:col-span-2 lg:text-[32px] lg:tracking-[-0.8px]">
        Configuración
      </h1>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3.5 rounded-tarjeta-lg bg-linear-to-br from-crema to-white p-4 ring-1 ring-borde">
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-kalo text-2xl font-extrabold text-white"
          >
            {datos.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 grow">
            <div className="truncate text-lg font-extrabold">{datos.nombre}</div>
            <div className="text-[13px] font-medium text-tinta-2">
              {datos.edad} años · {datos.estaturaCm} cm · {formatoDecimal(datos.pesoKg)} kg
            </div>
            {auth.fase === 'autenticado' && (
              <div className="truncate text-xs font-medium text-tinta-3">{auth.usuario.correo}</div>
            )}
          </div>
          <Link
            to={rutas.ajustesPerfil}
            aria-label="Editar perfil"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-kalo-oscuro ring-1 ring-borde hover:bg-crema-suave"
          >
            <Icon nombre="lapiz" tamano={18} />
          </Link>
        </div>

        <h2 id="mis-datos" className={claseSeccion}>
          Mis datos
        </h2>
        <ul aria-labelledby="mis-datos" className={claseTarjeta}>
          <Fila ruta={rutas.ajustesPerfil} icono="persona" nombre="Perfil" valor={datos.nombre} />
          <Fila
            ruta={rutas.ajustesMedidas}
            icono="bascula"
            nombre="Estatura y peso"
            valor={`${datos.estaturaCm} cm · ${formatoDecimal(datos.pesoKg)} kg`}
          />
          <Fila ruta={rutas.ajustesObjetivo} icono="diana" nombre="Objetivo y hábitos" />
        </ul>

        <h2 id="metas-diarias" className={claseSeccion}>
          Metas diarias
        </h2>
        <ul aria-labelledby="metas-diarias" className={claseTarjeta}>
          <Fila ruta={rutas.ajustesMetas} icono="muslo" nombre="Proteína · principal" valor={`${formatoEntero(metas.proteinaG)} g`} />
          <Fila ruta={rutas.ajustesMetas} icono="llama" nombre="Calorías · principal" valor={`${formatoEntero(metas.kcal)} kcal`} />
          <Fila ruta={rutas.ajustesMetas} icono="gota" nombre="Agua" valor={`${formatoDecimal(metas.aguaL, 2)} L`} />
          <Fila ruta={rutas.ajustesMetas} icono="pesa" nombre="Ejercicio" valor={`${formatoEntero(metas.ejercicioMin)} min`} />
          <Fila ruta={rutas.ajustesMetas} icono="luna" nombre="Sueño" valor={formatoDuracion(metas.suenoMin)} />
        </ul>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className={claseSeccion}>Inteligencia artificial</h2>
        <Link
          to={rutas.proveedorIA}
          className={`flex min-h-[62px] items-center gap-3 py-2 text-tinta no-underline hover:bg-crema-suave ${claseTarjeta}`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-crema text-kalo">
            <Icon nombre="destello" tamano={18} grosor={2} />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-sm font-bold">Proveedor, API key y modelo</span>
            <span className="truncate text-xs font-medium text-tinta-3">
              {config ? `${proveedores[config.proveedor].nombre} · ${config.nombreModelo}` : 'Sin configurar'}
            </span>
          </span>
          {config && (
            <span
              className={`shrink-0 rounded-md px-2 py-[3px] text-xs font-bold ${
                config.verificada ? 'bg-ia-fondo text-kalo-oscuro' : 'bg-media-fondo text-peso-texto'
              }`}
            >
              {config.verificada ? 'Conectado' : 'Sin verificar'}
            </span>
          )}
          <Icon nombre="flechaAdelante" tamano={16} grosor={2} className="shrink-0 text-tinta-3" />
        </Link>

        <h2 id="ajustes-recordatorios" className={claseSeccion}>
          Recordatorios
        </h2>
        <ul aria-labelledby="ajustes-recordatorios" className={claseTarjeta}>
          {recordatorios.slice(0, 4).map((recordatorio) => (
            <FilaRecordatorio
              key={recordatorio.id}
              recordatorio={recordatorio}
              onAlternar={() => alternar(recordatorio.id)}
            />
          ))}
        </ul>
        <p className="flex items-center gap-2 text-xs font-medium text-tinta-3">
          <Icon nombre="sobre" tamano={16} className="shrink-0" />
          {correo.disponible
            ? correoActivo
              ? 'También te los enviamos por correo.'
              : 'Puedes recibirlos también por correo.'
            : 'Por correo: disponible con una cuenta.'}
        </p>

        <div className="flex flex-col gap-2.5">
          <Button variante="suave" tamano="lg" to={rutas.recordatorios}>
            Ver todos los recordatorios
          </Button>
          {auth.fase === 'autenticado' ? (
            <button
              type="button"
              disabled={saliendo}
              onClick={() => void salir()}
              className="flex h-[50px] items-center justify-center gap-2 rounded-boton border border-borde bg-white text-[15px] font-bold text-error disabled:opacity-50"
            >
              <Icon nombre="salir" tamano={18} />
              {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
          ) : (
            <p className="text-center text-xs font-medium text-tinta-3">
              Modo demostración: no hay ninguna cuenta iniciada.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
