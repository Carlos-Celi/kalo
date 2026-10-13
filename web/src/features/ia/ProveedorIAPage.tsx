import { useNavigate } from 'react-router'
import { rutas } from '../../app/rutas'
import { useTitulo } from '../../app/useTitulo'
import { PantallaFlujo } from '../../components/ui/PantallaFlujo'
import { FormularioProveedorIA } from './FormularioProveedorIA'

/** Proveedor, API key y modelo de la IA, desde Configuración. */
export function ProveedorIAPage() {
  useTitulo('Proveedor de IA')
  const navegar = useNavigate()
  return (
    <PantallaFlujo titulo="Proveedor de IA" volver={rutas.ajustes} ancha>
      <FormularioProveedorIA onTerminar={() => void navegar(rutas.ajustes)} />
    </PantallaFlujo>
  )
}
