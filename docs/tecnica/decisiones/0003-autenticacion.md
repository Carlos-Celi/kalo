# 0003 · Autenticación con Supabase Auth

- Fecha: 2026-10-12
- Estado: aceptada

## Contexto
La web necesita cuentas de usuario. Es una SPA estática en Vercel, sin servidor propio, y el repositorio es público.

## Decisión
- **Supabase Auth con correo y contraseña**, flujo **PKCE** y confirmación de correo obligatoria. No se implementa criptografía ni almacenamiento de contraseñas propio.
- El navegador solo conoce la URL del proyecto y la clave **publishable**. La app valida esa configuración al arrancar y se detiene si recibe una clave secreta.
- El acceso a los datos lo decide la base de datos con **RLS**; las rutas protegidas del cliente son solo navegación.
- Sin variables de Supabase, la app arranca en **modo demostración** (sin cuentas, datos de ejemplo). Así el repositorio se puede clonar y probar sin crear nada, y el CI no necesita credenciales.
- Los mensajes de error son propios y genéricos; el texto del servidor nunca se muestra.
- Freno progresivo de reintentos en el cliente, además de los límites del servidor.
- CAPTCHA (Cloudflare Turnstile) opcional: se activa con una variable y la configuración de Supabase.

## Consecuencias
- La sesión se guarda en `localStorage` (comportamiento de `supabase-js`). Un XSS podría leerla; se mitiga con una CSP sin scripts en línea ni de terceros y con tokens de acceso de una hora con rotación del token de refresco. Guardarla en una cookie `HttpOnly` exigiría un servidor intermedio, que este proyecto no tiene.
- Por PKCE, los enlaces de confirmación y de recuperación deben abrirse en el mismo navegador que los pidió. La interfaz lo avisa.
- La comprobación de contraseñas filtradas depende del plan de Supabase; si no está disponible, la política se limita a la longitud mínima.
- Onboarding (nombre, medidas, metas) queda para una entrega posterior: hasta entonces el saludo de Inicio no muestra nombre.
