import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { PaginaLegal } from './PaginaLegal'

/**
 * Política de cookies y almacenamiento local. Kalo no usa cookies; lo que guarda
 * en el navegador es imprescindible para que funcione, por eso no hay banner
 * de consentimiento.
 */
export function CookiesPage() {
  return (
    <PaginaLegal titulo="Cookies y almacenamiento">
      <section>
        <p>
          <strong>Kalo no usa cookies</strong>: ni propias ni de terceros, ni de publicidad, ni de
          analítica, ni para seguirte entre sitios. Por eso no te mostramos un aviso para aceptarlas.
        </p>
        <p>
          Para funcionar, la app sí guarda algunos datos en el almacenamiento de tu navegador
          (equivalente a las cookies a efectos legales). Todos son estrictamente necesarios para el
          servicio que pides, no salen de tu dispositivo salvo lo que se indica y no sirven para
          identificarte ante terceros.
        </p>
      </section>

      <section aria-labelledby="c-que">
        <h2 id="c-que">Qué guardamos en tu navegador</h2>
        <ul className="!gap-2 [&_li]:!ml-0 [&_li]:!list-none">
          <li className="flex flex-col gap-1 rounded-boton-sm bg-muro p-3.5">
            <span className="font-semibold">Sesión de la cuenta</span>
            <span className="text-xs text-ceniza">localStorage, <code>sb-…</code></span>
            <span className="text-sm">Mantenerte con la sesión iniciada de forma segura.</span>
            <span className="text-xs text-ceniza">Dura: hasta que cierras sesión.</span>
          </li>
          <li className="flex flex-col gap-1 rounded-boton-sm bg-muro p-3.5">
            <span className="font-semibold">API key de IA cifrada y su llave</span>
            <span className="text-xs text-ceniza">IndexedDB «kalo»</span>
            <span className="text-sm">Usar tu proveedor de IA sin que la clave pase por nuestros servidores.</span>
            <span className="text-xs text-ceniza">Dura: hasta que la borras o eliminas la cuenta.</span>
          </li>
          <li className="flex flex-col gap-1 rounded-boton-sm bg-muro p-3.5">
            <span className="font-semibold">Configuración de IA y chats del asistente</span>
            <span className="text-xs text-ceniza">localStorage, <code>kalo:ia:…</code> y <code>kalo:chats:…</code></span>
            <span className="text-sm">Recordar el proveedor y el modelo elegidos y tus tres últimas conversaciones.</span>
            <span className="text-xs text-ceniza">Dura: hasta que los borras o eliminas la cuenta.</span>
          </li>
          <li className="flex flex-col gap-1 rounded-boton-sm bg-muro p-3.5">
            <span className="font-semibold">Recordatorios</span>
            <span className="text-xs text-ceniza">localStorage, <code>kalo:recordatorios:…</code> y <code>kalo:avisos-entregados</code></span>
            <span className="text-sm">Avisarte a tus horas y no repetir un aviso ya mostrado.</span>
            <span className="text-xs text-ceniza">Dura: hasta que los cambias o eliminas la cuenta.</span>
          </li>
          <li className="flex flex-col gap-1 rounded-boton-sm bg-muro p-3.5">
            <span className="font-semibold">Freno de intentos de acceso</span>
            <span className="text-xs text-ceniza">sessionStorage, <code>kalo.freno-login</code></span>
            <span className="text-sm">Frenar intentos repetidos de adivinar contraseñas.</span>
            <span className="text-xs text-ceniza">Dura: hasta cerrar la pestaña.</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="c-terceros">
        <h2 id="c-terceros">Terceros</h2>
        <p>
          Si la protección contra bots (Cloudflare Turnstile) está activada, su verificación se carga
          solo en la pantalla de acceso y puede guardar datos técnicos propios para distinguir
          personas de bots. No la usamos para nada más.
        </p>
      </section>

      <section aria-labelledby="c-control">
        <h2 id="c-control">Cómo borrarlo</h2>
        <p>
          Puedes borrar todo desde los ajustes de tu navegador («Borrar datos del sitio»). Eliminar
          tu cuenta desde <Link to={rutas.ajustes}>Configuración</Link> también borra estos datos de
          este dispositivo. Más detalles en la <Link to={rutas.privacidad}>política de privacidad</Link>.
        </p>
      </section>
    </PaginaLegal>
  )
}
