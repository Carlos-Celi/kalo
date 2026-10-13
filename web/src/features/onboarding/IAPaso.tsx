import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { PantallaFlujo } from '../../components/ui/PantallaFlujo'
import { FormularioProveedorIA } from '../ia/FormularioProveedorIA'

const beneficios: { icono: NombreIcono; titulo: string; detalle: string }[] = [
  {
    icono: 'camara',
    titulo: 'Registra con una foto',
    detalle: 'Estima calorías, proteína, azúcar y grasa de tu plato.',
  },
  {
    icono: 'chat',
    titulo: 'Asistente nutriólogo',
    detalle: 'Lee tus registros y te arma menús, ideas y análisis.',
  },
  {
    icono: 'candado',
    titulo: 'Tu clave, solo tuya',
    detalle: 'Se guarda cifrada en este dispositivo y va directo a tu proveedor.',
  },
]

/** Último paso del onboarding: conectar la IA ahora o dejarlo para después. */
export function IAPaso() {
  useTitulo('Conecta tu IA')
  const navegar = useNavigate()
  const empezar = () => void navegar(rutas.inicio, { replace: true })

  return (
    <PantallaFlujo titulo="Conecta tu IA" ancha>
      <div className="flex flex-col gap-1.5">
        <p className="text-[27px] leading-tight font-extrabold tracking-[-0.6px]">
          Un último paso: tu asistente de IA
        </p>
        <p className="text-sm leading-normal text-tinta-3">
          Usa tu propia API key para registrar comidas con foto y conversar con el asistente. Es
          opcional: puedes hacerlo ahora o más tarde desde Configuración.
        </p>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-3">
        {beneficios.map(({ icono, titulo, detalle }) => (
          <li key={titulo} className="flex gap-3 rounded-2xl bg-crema-suave p-3.5 ring-1 ring-borde">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-crema text-kalo">
              <Icon nombre={icono} tamano={20} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-extrabold">{titulo}</span>
              <span className="text-xs leading-normal font-medium text-tinta-3">{detalle}</span>
            </span>
          </li>
        ))}
      </ul>

      <FormularioProveedorIA
        onTerminar={empezar}
        extra={
          <button
            type="button"
            onClick={empezar}
            className="h-[50px] rounded-boton border border-borde text-[15px] font-bold text-tinta hover:bg-crema-suave"
          >
            Configurarla más tarde
          </button>
        }
      />
    </PantallaFlujo>
  )
}
