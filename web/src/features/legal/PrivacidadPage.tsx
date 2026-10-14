import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { leerContactoPrivacidad } from '../../lib/env'
import { PaginaLegal } from './PaginaLegal'

const contacto = leerContactoPrivacidad()

/** Política de privacidad: describe lo que la app hace de verdad con los datos. */
export function PrivacidadPage() {
  return (
    <PaginaLegal titulo="Política de privacidad">
      <section>
        <p>
          Kalo es una app para registrar lo que comes, el agua, el ejercicio, el sueño y el peso, y
          seguir dos metas: calorías y proteína. Esta política explica qué datos guarda, dónde, con
          quién se comparten y cómo puedes llevártelos o borrarlos. No vendemos datos, no mostramos
          publicidad y no usamos cookies ni herramientas de seguimiento o analítica.
        </p>
      </section>

      <section aria-labelledby="p-datos">
        <h2 id="p-datos">Qué datos guardamos</h2>
        <ul>
          <li>
            <strong>Cuenta</strong>: tu correo electrónico. La contraseña la gestiona el servicio de
            autenticación y nunca la vemos ni la guardamos en claro.
          </li>
          <li>
            <strong>Perfil y plan</strong>: nombre, edad, sexo, estatura, peso, peso meta, objetivo,
            actividad, sueño habitual, consumo de alcohol, restricciones o condiciones que elijas
            (por ejemplo diabetes o hipertensión) y las metas diarias que resultan.
          </li>
          <li>
            <strong>Registros</strong>: comidas (con calorías, proteína, azúcar, grasa y
            carbohidratos), agua, ejercicio, sueño y siestas, y peso con su nota.
          </li>
          <li>
            <strong>Foto de la comida</strong>: solo si dejas activada esa opción al analizarla, se
            guarda una miniatura muy comprimida junto a la comida. Puedes quitarla cuando quieras.
          </li>
          <li>
            <strong>Recordatorios</strong>: nombre, horas, si están activos, si quieres recibirlos por
            correo y tu zona horaria.
          </li>
        </ul>
        <p>
          Varios de estos datos son <strong>datos de salud</strong>. Solo los tratamos con tu
          consentimiento explícito, que das al crear la cuenta y puedes retirar en cualquier momento
          eliminándola.
        </p>
      </section>

      <section aria-labelledby="p-dispositivo">
        <h2 id="p-dispositivo">Lo que se queda en tu dispositivo</h2>
        <ul>
          <li>
            Tu <strong>API key de IA</strong>: se guarda cifrada en este navegador con una llave que
            ningún script puede extraer. Nunca se envía a nuestros servidores.
          </li>
          <li>
            Las <strong>conversaciones con el asistente</strong> (las tres más recientes) y la
            configuración de IA.
          </li>
          <li>
            La <strong>sesión</strong> iniciada, para no pedirte la contraseña cada vez.
          </li>
        </ul>
        <p>
          Cerrar sesión no borra estos datos del navegador; eliminar la cuenta sí. Si compartes el
          dispositivo, quien lo use podría verlos. El detalle está en{' '}
          <Link to={rutas.cookies}>cookies y almacenamiento</Link>.
        </p>
      </section>

      <section aria-labelledby="p-para">
        <h2 id="p-para">Para qué los usamos</h2>
        <ul>
          <li>Calcular tu plan y mostrar tu avance, tus gráficas y tus rachas.</li>
          <li>Enviarte los recordatorios que actives, en el navegador o por correo.</li>
          <li>
            Darle contexto al asistente y a la estimación por foto cuando tú los usas (ver el
            siguiente apartado).
          </li>
        </ul>
        <p>No tomamos decisiones automáticas con efectos legales sobre ti ni elaboramos perfiles comerciales.</p>
      </section>

      <section aria-labelledby="p-terceros">
        <h2 id="p-terceros">Con quién se comparten</h2>
        <ul>
          <li>
            <strong>El proveedor de IA que elijas</strong> (Anthropic, OpenAI o Google): cuando
            analizas una foto o hablas con el asistente, la app envía directamente desde tu
            navegador la foto reducida o tu mensaje junto con tus metas y registros. Lo hace con tu
            propia API key, así que esos datos quedan sujetos a la política de ese proveedor.
            Si no configuras ninguna IA, no se envía nada.
          </li>
          <li>
            <strong>Base de datos y autenticación</strong> (Supabase): guarda tu cuenta y tus
            registros. Cada persona solo puede leer y modificar sus propios datos; la base de datos
            lo impone con reglas de acceso por fila.
          </li>
          <li>
            <strong>Correo</strong> (Resend): solo si activas los recordatorios por correo; recibe tu
            dirección y el aviso, sin cifras de salud.
          </li>
          <li>
            <strong>Alojamiento</strong>: el servidor que entrega la app puede registrar datos
            técnicos de las visitas (como la dirección IP) por seguridad.
          </li>
          <li>
            <strong>Protección contra bots</strong> (Cloudflare Turnstile): si está activada, en la
            pantalla de acceso.
          </li>
        </ul>
        <p>Algunos de estos servicios pueden tratar datos fuera de tu país, con las garantías que ofrecen en sus propias políticas.</p>
      </section>

      <section aria-labelledby="p-seguridad">
        <h2 id="p-seguridad">Cómo los protegemos</h2>
        <p>
          Las conexiones van cifradas (HTTPS) y la base de datos cifra lo almacenado. La app aplica
          una política de seguridad de contenido estricta, no carga scripts de terceros salvo la
          protección contra bots y no muestra nunca los mensajes internos de error. El código es
          abierto y se puede revisar.
        </p>
      </section>

      <section aria-labelledby="p-plazo">
        <h2 id="p-plazo">Cuánto tiempo</h2>
        <p>
          Mientras tengas la cuenta. Al eliminarla se borran de inmediato de la base de datos tu
          perfil, tus registros, tus fotos y tus recordatorios; las copias de seguridad del
          proveedor se renuevan según su propio calendario.
        </p>
      </section>

      <section aria-labelledby="p-derechos">
        <h2 id="p-derechos">Tus derechos</h2>
        <ul>
          <li>
            <strong>Acceso y portabilidad</strong>: en <Link to={rutas.ajustes}>Configuración</Link>,
            «Descargar mis datos» genera un archivo con todo lo que guardamos.
          </li>
          <li>
            <strong>Rectificación</strong>: puedes editar tu perfil, tus metas y cada registro.
          </li>
          <li>
            <strong>Supresión y retirada del consentimiento</strong>: «Eliminar mi cuenta» borra la
            cuenta y todos sus datos.
          </li>
        </ul>
        <p>
          {contacto ? (
            <>
              Para cualquier otra consulta sobre privacidad escribe a{' '}
              <a href={`mailto:${contacto}`}>{contacto}</a>.
            </>
          ) : (
            <>Puedes ejercer todos estos derechos tú mismo desde Configuración, sin pedir permiso a nadie.</>
          )}{' '}
          También puedes reclamar ante la autoridad de protección de datos de tu país.
        </p>
      </section>

      <section aria-labelledby="p-menores">
        <h2 id="p-menores">Menores</h2>
        <p>Kalo es para mayores de 16 años; el registro no admite edades menores.</p>
      </section>

      <section aria-labelledby="p-cambios">
        <h2 id="p-cambios">Cambios</h2>
        <p>
          Si esta política cambia de forma importante, lo indicaremos en la app y la fecha de
          versión de arriba se actualizará.
        </p>
      </section>
    </PaginaLegal>
  )
}
