# Seguridad

El repositorio es **público**. Regla de partida: todo lo que está en git, y todo lo que llega al navegador, lo puede leer cualquiera.

Estado: ✅ aplicado · ⏳ previsto (se indica en qué entrega)

## 1. Secretos fuera de git

| Control | Estado |
|---|---|
| `.gitignore` excluye `.env*` (salvo `.env.example`), claves (`*.pem`, `*.key`…), `.vercel/` y los archivos locales de Supabase | ✅ |
| `web/.env.example` documenta los nombres de las variables, sin valores | ✅ |
| gitleaks antes de cada commit (`.githooks/pre-commit`) | ✅ |
| gitleaks en CI sobre todo el historial en cada push y PR | ✅ |
| *Secret scanning* y *push protection* de GitHub activados en el repositorio | ✅ |
| Variables de despliegue solo en los paneles de Vercel y Supabase ([despliegue.md](despliegue.md)); el repositorio no nombra ningún proyecto concreto | ✅ |
| La app valida su configuración al arrancar y se detiene si recibe una clave secreta de Supabase (`web/src/lib/env.ts`) | ✅ |

Si un secreto llega a subirse: **se revoca y se rota primero**; borrarlo del historial no basta porque ya pudo copiarse.

### Qué puede ir en el frontend
Vite incrusta en el JavaScript público cualquier variable `VITE_*`. Solo pueden llevar ese prefijo valores públicos por diseño: la URL de Supabase y su clave *publishable/anon*. La clave `service_role`, los tokens de Vercel y cualquier API key de un proveedor de IA **nunca** llevan `VITE_` ni se escriben en el código.

## 2. Cabeceras del navegador

Definidas en `web/vercel.json` para el despliegue y replicadas en `web/nginx.conf` para la vista previa local (allí sin HSTS, porque es http, y con `connect-src` apuntando al Supabase local).

| Cabecera | Valor | Protege de |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'`; estilos y fuentes solo del propio origen; scripts propios y el de Turnstile; conexiones solo al propio origen, a Supabase y a los tres proveedores de IA; marcos solo de Turnstile; manifiesto y workers solo del propio origen; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'` | XSS, exfiltración de datos, clickjacking |
| `Strict-Transport-Security` | dos años, con subdominios | Degradación a http |
| `X-Content-Type-Options` | `nosniff` | Interpretación errónea de tipos |
| `X-Frame-Options` | `DENY` | Clickjacking en navegadores antiguos |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuga de rutas a terceros |
| `Permissions-Policy` | cámara solo para el propio origen; micrófono, ubicación, pagos, USB, serie, HID, Bluetooth, MIDI, sensores de movimiento, captura de pantalla, bloqueo de pantalla y Topics desactivados | Abuso de APIs del dispositivo y rastreo |
| `Cross-Origin-Opener-Policy` | `same-origin` | Ataques entre ventanas |
| `Cross-Origin-Resource-Policy` | `same-origin` | Que otros sitios incrusten o lean los recursos (Spectre y fugas entre orígenes) |
| `X-Permitted-Cross-Domain-Policies` | `none` | Políticas cruzadas de clientes antiguos (Flash, PDF) |
| `Origin-Agent-Cluster` | `?1` | Aísla el origen en su propio proceso cuando el navegador lo permite |
| `Cache-Control` | `no-cache` en el HTML; un año e inmutable en `/assets` (con hash) | Que una corrección de seguridad tarde en llegar |

Para que la CSP no necesite `'unsafe-inline'` ni `data:`: la fuente se autoaloja, el build no incrusta recursos (`assetsInlineLimit: 0`) y no hay scripts ni estilos en línea. `connect-src` solo se amplía de forma explícita: Supabase y los tres proveedores de IA. La foto analizada se pinta en un `<canvas>`, así que `img-src` no necesita `data:`.

Además: `robots.txt` solo deja indexar el acceso y los documentos legales, `/.well-known/security.txt` (RFC 9116) indica cómo informar de vulnerabilidades y [`SECURITY.md`](../../SECURITY.md) es la política de divulgación responsable. El manifiesto web se sirve con su tipo exacto porque `nosniff` está activo.

Considerado y descartado por ahora: *Trusted Types* (`require-trusted-types-for 'script'`). React no usa `innerHTML`, pero no se ha podido verificar el script de Turnstile y la página de acceso con cuentas reales; activarlo sin probarlo podría romper el inicio de sesión en producción.

## 3. Código

| Práctica | Estado |
|---|---|
| TypeScript estricto y lint en CI | ✅ |
| Sin `dangerouslySetInnerHTML`, `eval` ni HTML construido con texto del usuario (React escapa por defecto) | ✅ |
| Rutas internas como constantes; ningún redireccionamiento a URLs tomadas de parámetros | ✅ |
| Sin mapas de código fuente en producción | ✅ |
| Validación de la entrada en cliente y de nuevo en servidor (restricciones `check` y RLS en la base de datos) | ✅ login, perfil, onboarding y registros |
| Nada sensible en `console.log`, URLs ni mensajes de error | ✅ norma vigente |

## 4. Dependencias y contenedores

| Control | Estado |
|---|---|
| Instalación reproducible (`npm ci` con `package-lock.json`) | ✅ |
| `npm audit` en CI (falla con vulnerabilidades altas o críticas) | ✅ |
| Dependabot semanal para npm y GitHub Actions | ✅ |
| Acciones de GitHub fijadas por hash de commit y permisos mínimos del token | ✅ |
| Contenedores sin root; vista previa en solo lectura y sin capacidades; puertos solo en `127.0.0.1` | ✅ |

## 5. Autenticación

Se delega en Supabase Auth; no se implementa criptografía propia ni se guardan contraseñas. Motivos en [ADR 0003](decisiones/0003-autenticacion.md).

| Amenaza | Control |
|---|---|
| Fuerza bruta y relleno de credenciales | Límites de intentos de Supabase; freno progresivo en el cliente (bloqueo de 30 s al quinto fallo, que se duplica hasta 15 min); CAPTCHA con Turnstile si se configura |
| Contraseñas débiles o filtradas | Mínimo 8 caracteres con letras y números (`password_requirements = "letters_digits"`, validado igual en el cliente), máximo 72 bytes; comprobación contra filtraciones si el plan de Supabase la ofrece |
| Enumeración de usuarios | Registro y recuperación responden igual exista o no la cuenta; el inicio de sesión no distingue correo de contraseña; nunca se muestra el texto de error del servidor |
| Robo del código de autorización | Flujo PKCE |
| Cuentas con correo ajeno | Confirmación de correo obligatoria |
| Acceso a datos de otro usuario | RLS en todas las tablas, sin permisos para el rol anónimo y con permisos por columna; probado con dos usuarios |
| Redirección abierta tras el login | Solo se vuelve a rutas internas; los enlaces de correo solo pueden apuntar a las URLs autorizadas en Supabase |
| Escalada desde funciones de base de datos | Las funciones `security definer` fijan `search_path` y no son invocables desde la API |
| Secuestro de sesión | Tokens de acceso de una hora con rotación del token de refresco; la CSP limita el alcance de un XSS. La sesión vive en `localStorage` (limitación asumida, ver ADR 0003) |

La seguridad no depende del cliente: la clave pública de Supabase la puede usar cualquiera, por eso las reglas de acceso están en la base de datos.

## 6. API keys de proveedores de IA

La especificación exige que la API key del usuario no pase por servidores propios. En un navegador no existe un almacén seguro equivalente al del móvil, así que la política es ([ADR 0005](decisiones/0005-ia-desde-el-navegador.md)):

| Control | Estado |
|---|---|
| La key se guarda solo en el dispositivo, cifrada con AES-GCM usando una `CryptoKey` **no extraíble**, en IndexedDB (`web/src/features/ia/boveda.ts`). Nunca en `localStorage`, en la URL ni en Supabase | ✅ comprobado en el navegador: la clave de cifrado no es extraíble y el valor guardado no contiene el texto en claro |
| Las llamadas van directas del navegador al proveedor elegido; `connect-src` solo permite `api.anthropic.com`, `api.openai.com` y `generativelanguage.googleapis.com` además de Supabase | ✅ |
| La key nunca aparece en registros ni en mensajes de error (los clientes devuelven un motivo propio, no el texto del proveedor), y el campo se muestra oculto por defecto | ✅ |
| Las peticiones a los proveedores van sin credenciales del sitio ni cabecera `Referer`; la key de Google va en una cabecera, no en la URL | ✅ |
| La respuesta de la IA se trata como datos: se valida contra un esquema, se acota a los límites de un registro y se pinta como texto (React escapa por defecto) | ✅ |
| La foto se envía solo al proveedor elegido, reducida. Solo si la persona lo deja activado se guarda además una miniatura WebP ultracomprimida en `comidas.foto` (RLS por usuario, formato y tamaño validados por la base de datos); se puede quitar en cualquier momento ([ADR 0008](decisiones/0008-fotos-de-comida-ultracomprimidas.md)) | ✅ probado contra la base local |

Límite conocido: un XSS en la página podría usar la key mientras la sesión está abierta. Por eso la CSP estricta y la ausencia de scripts de terceros son parte de este control; conviene usar una key con límite de gasto.

Los chats del asistente se guardan en `localStorage` por usuario (`kalo:chats:<id>`, los 3 más recientes) y nunca viajan a Supabase; sí se envían al proveedor de IA elegido junto con los registros que el asistente necesita para responder ([ADR 0007](decisiones/0007-asistente-con-datos-completos-y-chats-locales.md)). Cerrar sesión no borra los chats del dispositivo: quien comparta navegador puede verlos, igual que la configuración de IA.

### Recordatorios y correo

| Control | Estado |
|---|---|
| Los recordatorios (nombre y horas, sin datos de salud) están en `public.recordatorios` con RLS: cada usuario solo ve y modifica los suyos | ✅ migración `20261014010000` |
| `avisos_enviados` tiene RLS sin políticas ni permisos: solo la función, con la clave de servicio, la usa | ✅ |
| La Edge Function se protege con un secreto compartido (`x-cron-secret`, comparado en tiempo constante) porque lleva `verify_jwt = false`; sin él responde 401 | ✅ en código · sin probar desplegada |
| `RESEND_API_KEY`, `CRON_SECRET` y el remitente son secretos de Supabase, nunca están en git ni en `VITE_*` | ✅ ([guía](recordatorios-por-correo.md)) |
| El correo no incluye cifras de salud, solo el aviso y un enlace; el texto de los recordatorios propios se escapa en el HTML | ✅ probado |

## 7. Privacidad y control de los datos

Decisión en [ADR 0011](decisiones/0011-politicas-y-control-de-datos.md).

| Control | Estado |
|---|---|
| Política de privacidad (`/privacidad`), términos de uso (`/terminos`) y política de cookies y almacenamiento (`/cookies`), públicas y enlazadas desde el acceso y desde Configuración | ✅ |
| Consentimiento explícito al crear la cuenta (términos, privacidad y datos de salud); sin él no se envía el registro. Se guarda la versión aceptada y la fecha en los metadatos de la cuenta | ✅ |
| Sin cookies, analítica ni publicidad; el almacenamiento local es estrictamente necesario y está detallado en `/cookies`, por eso no hay banner | ✅ |
| **Descargar mis datos**: JSON con perfil, plan, registros, pesos y recordatorios (sin fotos ni API key) | ✅ |
| **Eliminar mi cuenta**: confirmación escribiendo «ELIMINAR»; la función `eliminar_mi_cuenta()` (`security definer`, `search_path` vacío, solo para `authenticated`) borra `auth.users` del que llama y, en cascada, todo lo suyo; después se borran la API key, los chats y lo local de este dispositivo y se cierra la sesión | ✅ probado contra la base local: el rol anónimo recibe 401, la cuenta y sus registros desaparecen y otra cuenta queda intacta |
| Mensajes de error con el mismo componente (`Alerta`): dicen qué pasó y qué hacer, sin el texto interno del servidor ni del proveedor | ✅ |

Límite conocido: un token de acceso emitido antes de borrar la cuenta sigue siendo válido hasta que caduca (una hora), pero ya no ve filas (RLS) ni puede crear nada (la cuenta no existe).

## 8. Avisos de producto
El asistente y las estimaciones de la IA no sustituyen el consejo médico; el aviso forma parte de la interfaz.
