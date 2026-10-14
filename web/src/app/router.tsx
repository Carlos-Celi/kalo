import { createBrowserRouter, Outlet, type RouteObject } from 'react-router'
import { AjustesPage } from '../features/ajustes/AjustesPage'
import { MedidasAjustePage } from '../features/ajustes/MedidasAjustePage'
import { MetasAjustePage } from '../features/ajustes/MetasAjustePage'
import { ObjetivoAjustePage } from '../features/ajustes/ObjetivoAjustePage'
import { PerfilAjustePage } from '../features/ajustes/PerfilAjustePage'
import { AuthProvider } from '../features/auth/AuthProvider'
import { LoginPage } from '../features/auth/LoginPage'
import { RestablecerPage } from '../features/auth/RestablecerPage'
import { RutaProtegida } from '../features/auth/RutaProtegida'
import { AnalisisPage } from '../features/ia/AnalisisPage'
import { AsistentePage } from '../features/ia/AsistentePage'
import { CamaraPage } from '../features/ia/CamaraPage'
import { ProveedorIAPage } from '../features/ia/ProveedorIAPage'
import { InicioPage } from '../features/inicio/InicioPage'
import { HabitosPaso } from '../features/onboarding/HabitosPaso'
import { IAPaso } from '../features/onboarding/IAPaso'
import { MedidasPaso } from '../features/onboarding/MedidasPaso'
import { ObjetivosPaso } from '../features/onboarding/ObjetivosPaso'
import { OnboardingLayout } from '../features/onboarding/OnboardingLayout'
import { PerfilPaso } from '../features/onboarding/PerfilPaso'
import { PlanPaso } from '../features/onboarding/PlanPaso'
import { PerfilProvider } from '../features/perfil/PerfilProvider'
import { PesoPage } from '../features/peso/PesoPage'
import { ProgresoPage } from '../features/progreso/ProgresoPage'
import { AvisosRecordatorios } from '../features/recordatorios/AvisosRecordatorios'
import { RecordatoriosPage } from '../features/recordatorios/RecordatoriosPage'
import { ComidaFormPage } from '../features/registros/ComidaFormPage'
import { RegistroRapidoPage } from '../features/registros/RegistroRapidoPage'
import { RegistrosPage } from '../features/registros/RegistrosPage'
import { RequierePlan } from '../features/perfil/RequierePlan'
import { AppShell, type ManejadorDeRuta } from './AppShell'
import { CookiesPage } from '../features/legal/CookiesPage'
import { PrivacidadPage } from '../features/legal/PrivacidadPage'
import { TerminosPage } from '../features/legal/TerminosPage'
import { PaginaNoEncontrada } from './PaginaNoEncontrada'
import { PantallaError } from './PantallaError'
import { rutas } from './rutas'

const pantallasConNavegacion: RouteObject[] = [
  {
    element: (
      <RequierePlan>
        <AppShell />
      </RequierePlan>
    ),
    children: [
      { path: rutas.inicio, element: <InicioPage /> },
      { path: rutas.registros, element: <RegistrosPage seccion="comida" /> },
      { path: rutas.registrosAgua, element: <RegistrosPage seccion="agua" /> },
      { path: rutas.registrosEjercicio, element: <RegistrosPage seccion="ejercicio" /> },
      { path: rutas.registrosSueno, element: <RegistrosPage seccion="sueno" /> },
      {
        // La hoja se abre sobre Inicio, como en el diseño.
        path: rutas.registroRapido,
        element: (
          <>
            <InicioPage />
            <RegistroRapidoPage />
          </>
        ),
      },
      {
        path: rutas.asistente,
        element: <AsistentePage />,
        handle: { pantallaCompleta: true } satisfies ManejadorDeRuta,
      },
      { path: rutas.progreso, element: <ProgresoPage /> },
      { path: rutas.recordatorios, element: <RecordatoriosPage /> },
      { path: rutas.ajustes, element: <AjustesPage /> },
      { path: rutas.ajustesPerfil, element: <PerfilAjustePage /> },
      { path: rutas.ajustesMedidas, element: <MedidasAjustePage /> },
      { path: rutas.ajustesObjetivo, element: <ObjetivoAjustePage /> },
      { path: rutas.ajustesMetas, element: <MetasAjustePage /> },
      { path: '*', element: <PaginaNoEncontrada /> },
    ],
  },
]

/** Pantallas de un solo propósito, a pantalla completa y sin tab bar. */
const flujos: RouteObject = {
  element: (
    <RequierePlan>
      <Outlet />
    </RequierePlan>
  ),
  children: [
    { path: rutas.comidaManual, element: <ComidaFormPage /> },
    { path: rutas.comidaEditar, element: <ComidaFormPage /> },
    { path: rutas.peso, element: <PesoPage /> },
    { path: rutas.camara, element: <CamaraPage /> },
    { path: rutas.analisis, element: <AnalisisPage /> },
    { path: rutas.proveedorIA, element: <ProveedorIAPage /> },
  ],
}

const onboarding: RouteObject = {
  path: rutas.bienvenida,
  element: <OnboardingLayout />,
  children: [
    { index: true, element: <PerfilPaso /> },
    { path: rutas.bienvenidaMedidas, element: <MedidasPaso /> },
    { path: rutas.bienvenidaObjetivos, element: <ObjetivosPaso /> },
    { path: rutas.bienvenidaHabitos, element: <HabitosPaso /> },
    { path: rutas.bienvenidaPlan, element: <PlanPaso /> },
    { path: rutas.bienvenidaIA, element: <IAPaso /> },
  ],
}

const rutasDeLaApp: RouteObject[] = [
  {
    // Con sesión: se carga el perfil y, si aún no hay plan, se pasa por el onboarding.
    element: (
      <RutaProtegida>
        <PerfilProvider>
          <AvisosRecordatorios />
          <Outlet />
        </PerfilProvider>
      </RutaProtegida>
    ),
    children: [onboarding, flujos, ...pantallasConNavegacion],
  },
  { path: rutas.login, element: <LoginPage /> },
  { path: rutas.restablecer, element: <RestablecerPage /> },
  // Públicas: se pueden leer antes de crear la cuenta.
  { path: rutas.privacidad, element: <PrivacidadPage /> },
  { path: rutas.terminos, element: <TerminosPage /> },
  { path: rutas.cookies, element: <CookiesPage /> },
]

/** Todas las rutas cuelgan del proveedor de sesión. */
export const definicionRutas: RouteObject[] = [
  {
    errorElement: <PantallaError />,
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: rutasDeLaApp,
  },
]

export const router = createBrowserRouter(definicionRutas)
