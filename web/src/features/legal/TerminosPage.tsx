import { Link } from 'react-router'
import { rutas } from '../../app/rutas'
import { PaginaLegal } from './PaginaLegal'

/** Términos de uso: reglas del servicio y aviso de que no es consejo médico. */
export function TerminosPage() {
  return (
    <PaginaLegal titulo="Términos de uso">
      <section>
        <p>
          Al crear una cuenta o usar Kalo aceptas estos términos. Léelos junto con la{' '}
          <Link to={rutas.privacidad}>política de privacidad</Link>.
        </p>
      </section>

      <section aria-labelledby="t-medico">
        <h2 id="t-medico">Kalo no es consejo médico</h2>
        <p>
          Kalo te ayuda a registrar y entender tus hábitos. Las metas que calcula, las estimaciones
          por foto y las respuestas del asistente son <strong>orientativas y pueden equivocarse</strong>.
          No sustituyen el diagnóstico ni el consejo de un profesional de la salud.
        </p>
        <p>
          Consulta a un profesional antes de cambiar tu alimentación si estás embarazada o en
          lactancia, tienes una enfermedad crónica, tomas medicación o tienes o has tenido un
          trastorno de la conducta alimentaria. Si algo te preocupa sobre tu salud, acude a un
          profesional; en una urgencia, llama a los servicios de emergencia.
        </p>
      </section>

      <section aria-labelledby="t-cuenta">
        <h2 id="t-cuenta">Tu cuenta</h2>
        <ul>
          <li>Debes tener al menos 16 años.</li>
          <li>Eres responsable de mantener tu contraseña en secreto y de lo que se haga con tu cuenta.</li>
          <li>Los datos que registras son tuyos: puedes descargarlos o eliminar la cuenta cuando quieras desde Configuración.</li>
        </ul>
      </section>

      <section aria-labelledby="t-uso">
        <h2 id="t-uso">Uso aceptable</h2>
        <p>
          No uses Kalo para intentar acceder a datos de otras personas, saturar o atacar el servicio,
          eludir sus medidas de seguridad ni para nada ilegal. Podemos suspender cuentas que lo hagan.
        </p>
      </section>

      <section aria-labelledby="t-ia">
        <h2 id="t-ia">Inteligencia artificial de terceros</h2>
        <p>
          La estimación por foto y el asistente usan el proveedor que tú eliges (Anthropic, OpenAI o
          Google) con tu propia API key. El coste de esas llamadas lo factura tu proveedor, y su uso
          se rige también por sus términos. Revisa siempre lo que la IA propone antes de guardarlo.
        </p>
      </section>

      <section aria-labelledby="t-servicio">
        <h2 id="t-servicio">El servicio</h2>
        <p>
          Kalo se ofrece tal cual, sin garantía de que esté siempre disponible o libre de errores.
          Podemos cambiar o retirar funciones. En la medida en que la ley lo permita, no respondemos
          de daños derivados de decisiones tomadas a partir de las estimaciones de la app. Nada de
          esto limita los derechos que te reconozca la ley de tu país como consumidor.
        </p>
        <p>
          El código de Kalo es abierto y se puede revisar en su{' '}
          <a href="https://github.com/Carlos-Celi/kalo" target="_blank" rel="noreferrer noopener">
            repositorio
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="t-cambios">
        <h2 id="t-cambios">Cambios y baja</h2>
        <p>
          Si estos términos cambian de forma importante, lo indicaremos en la app. Puedes dejar de
          usar Kalo y eliminar tu cuenta en cualquier momento.
        </p>
      </section>
    </PaginaLegal>
  )
}
