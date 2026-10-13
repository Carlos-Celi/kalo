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
| Variables de despliegue solo en los paneles de Vercel y Supabase | ⏳ entrega 2 |

Si un secreto llega a subirse: **se revoca y se rota primero**; borrarlo del historial no basta porque ya pudo copiarse.

### Qué puede ir en el frontend
Vite incrusta en el JavaScript público cualquier variable `VITE_*`. Solo pueden llevar ese prefijo valores públicos por diseño: la URL de Supabase y su clave *publishable/anon*. La clave `service_role`, los tokens de Vercel y cualquier API key de un proveedor de IA **nunca** llevan `VITE_` ni se escriben en el código.

## 2. Cabeceras del navegador

Definidas en `web/nginx.conf` para la vista previa local; el despliegue en Vercel usará las mismas (⏳ entrega 2, más HSTS).

| Cabecera | Valor | Protege de |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'`; scripts, estilos, fuentes y conexiones solo del propio origen; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'` | XSS, exfiltración de datos, clickjacking |
| `X-Content-Type-Options` | `nosniff` | Interpretación errónea de tipos |
| `X-Frame-Options` | `DENY` | Clickjacking en navegadores antiguos |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuga de rutas a terceros |
| `Permissions-Policy` | cámara solo para el propio origen; micrófono, ubicación y pagos desactivados | Abuso de APIs del dispositivo |
| `Cross-Origin-Opener-Policy` | `same-origin` | Ataques entre ventanas |

Para que la CSP no necesite `'unsafe-inline'` ni `data:`: la fuente se autoaloja, el build no incrusta recursos (`assetsInlineLimit: 0`) y no hay scripts ni estilos en línea. `connect-src` se ampliará de forma explícita solo a Supabase y a los proveedores de IA cuando se integren.

## 3. Código

| Práctica | Estado |
|---|---|
| TypeScript estricto y lint en CI | ✅ |
| Sin `dangerouslySetInnerHTML`, `eval` ni HTML construido con texto del usuario (React escapa por defecto) | ✅ |
| Rutas internas como constantes; ningún redireccionamiento a URLs tomadas de parámetros | ✅ |
| Sin mapas de código fuente en producción | ✅ |
| Validación de toda entrada con esquema, en cliente y de nuevo en servidor | ⏳ con los primeros formularios |
| Nada sensible en `console.log`, URLs ni mensajes de error | ✅ norma vigente |

## 4. Dependencias y contenedores

| Control | Estado |
|---|---|
| Instalación reproducible (`npm ci` con `package-lock.json`) | ✅ |
| `npm audit` en CI (falla con vulnerabilidades altas o críticas) | ✅ |
| Dependabot semanal para npm y GitHub Actions | ✅ |
| Acciones de GitHub fijadas por hash de commit y permisos mínimos del token | ✅ |
| Contenedores sin root; vista previa en solo lectura y sin capacidades; puertos solo en `127.0.0.1` | ✅ |

## 5. Autenticación (⏳ entrega 2)

Se delega en Supabase Auth; no se implementa criptografía propia ni se guardan contraseñas.

| Amenaza | Control previsto |
|---|---|
| Fuerza bruta y relleno de credenciales | Límites de intentos de Supabase, CAPTCHA (Turnstile) en registro e inicio de sesión, freno progresivo en el cliente |
| Contraseñas débiles o filtradas | Longitud mínima y comprobación contra contraseñas filtradas |
| Enumeración de usuarios | Mensajes de error genéricos: no se revela si un correo existe |
| Robo del código de autorización | Flujo PKCE |
| Cuentas con correo ajeno | Confirmación de correo obligatoria |
| Acceso a datos de otro usuario | RLS en todas las tablas (`auth.uid() = user_id`); se prueba con dos usuarios |
| Secuestro de sesión | Tokens de vida corta con rotación del token de refresco; la CSP limita el alcance de un XSS |

La seguridad no depende del cliente: la clave pública de Supabase la puede usar cualquiera, por eso las reglas de acceso están en la base de datos.

## 6. API keys de proveedores de IA (⏳ entrega de IA)

La especificación exige que la API key del usuario no pase por servidores propios. En un navegador no existe un almacén seguro equivalente al del móvil, así que la política será:

- La key se guarda solo en el dispositivo, cifrada con WebCrypto usando una clave no extraíble, en IndexedDB. Nunca en `localStorage`, en la URL ni en Supabase.
- Las llamadas van directas del navegador al proveedor elegido; la CSP solo permite conectar con los dominios de esos proveedores.
- La key nunca aparece en registros, mensajes de error ni analíticas, y el campo se muestra oculto por defecto.
- Límite conocido: un XSS en la página podría usar la key mientras la sesión está abierta. Por eso la CSP estricta y la ausencia de scripts de terceros son parte de este control, y se recomendará al usuario una key con límite de gasto.

## 7. Avisos de producto
El asistente y las estimaciones de la IA no sustituyen el consejo médico; el aviso forma parte de la interfaz.
