import { Icon, type NombreIcono } from '../../components/ui/Icon'
import { Interruptor } from '../../components/ui/Interruptor'
import { descripcionDe, type Recordatorio, type TipoRecordatorio } from '../../domain/recordatorios'

const iconoDeRecordatorio: Record<TipoRecordatorio, NombreIcono> = {
  agua: 'gota',
  comidas: 'cubiertos',
  ejercicio: 'pesa',
  dormir: 'luna',
  peso: 'bascula',
  propio: 'campana',
}

/** Fila de un recordatorio: icono, nombre, horario e interruptor. */
export function FilaRecordatorio({
  recordatorio,
  onAlternar,
  onBorrar,
}: {
  recordatorio: Recordatorio
  onAlternar: () => void
  onBorrar?: () => void
}) {
  return (
    <li className="flex items-center gap-3 border-b border-divisor py-2 last:border-b-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-crema text-kalo">
        <Icon nombre={iconoDeRecordatorio[recordatorio.tipo]} tamano={18} />
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="truncate text-sm font-bold">{recordatorio.nombre}</span>
        <span className="text-xs font-medium text-tinta-3">{descripcionDe(recordatorio)}</span>
      </span>
      {onBorrar && (
        <button
          type="button"
          aria-label={`Eliminar ${recordatorio.nombre}`}
          onClick={onBorrar}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-tinta-3 hover:text-error"
        >
          <Icon nombre="papelera" tamano={18} />
        </button>
      )}
      <Interruptor etiqueta={recordatorio.nombre} activo={recordatorio.activo} onCambio={onAlternar} />
    </li>
  )
}
