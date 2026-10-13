# Despliegue: Vercel y Supabase

El repositorio es público y **no contiene nada de ningún despliegue concreto**: ni URLs de proyecto, ni claves, ni identificadores. Cada quien configura el suyo en los paneles de Vercel y Supabase siguiendo estos pasos.

## 1. Supabase

1. Crea un proyecto en <https://supabase.com/dashboard>. Guarda la contraseña de la base de datos en tu gestor de contraseñas; no hace falta en ningún archivo.
2. Aplica el esquema del repositorio:
   ```bash
   supabase login
   supabase link --project-ref <ref-de-tu-proyecto>
   supabase db push
   ```
   `supabase link` guarda el identificador en `supabase/.temp/`, que está ignorado por git.
3. **Authentication → Sign In / Providers → Email**: activa *Confirm email* y *Secure password change*; longitud mínima de contraseña 8 o más. Si tu plan lo permite, activa *Prevent use of leaked passwords*.
4. **Authentication → URL Configuration**: *Site URL* = la URL de producción en Vercel. En *Redirect URLs* añade `https://<tu-dominio>/**` y, si quieres probar las vistas previas de Vercel, su patrón (`https://*-<tu-equipo>.vercel.app/**`).
5. **Authentication → Rate Limits**: deja los valores por defecto o redúcelos; no los subas.
6. (Recomendado) **Authentication → Attack Protection**: activa el CAPTCHA con Cloudflare Turnstile y pega ahí la *secret key*. La *site key* (pública) va en Vercel como `VITE_TURNSTILE_SITE_KEY`.
7. **Project Settings → API Keys**: copia la *Project URL* y la clave **publishable** (o `anon`). La clave `secret` / `service_role` no se usa en este proyecto: no la copies a ningún sitio.

## 2. Vercel

1. En <https://vercel.com/new>, importa el repositorio de GitHub.
2. **Root Directory**: `web`. El resto lo toma de `web/vercel.json` (Vite, `npm ci`, `npm run build`, salida `dist`).
3. **Environment Variables** (Production y Preview):

   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL de Supabase |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave publishable/anon |
   | `VITE_TURNSTILE_SITE_KEY` | (opcional) site key de Turnstile |

   Son valores públicos por diseño: acaban en el JavaScript que descarga el navegador. Aun así se definen en Vercel y no en git, para que el repositorio no quede atado a un despliegue.
4. Despliega. Desde entonces cada push a `main` publica en producción y cada rama o PR genera una vista previa.

## 3. Comprobar el despliegue

```bash
curl -sI https://<tu-dominio>/ | grep -iE "content-security|strict-transport|x-frame|x-content|referrer|permissions"
curl -s -o /dev/null -w "%{http_code}\n" https://<tu-dominio>/progreso
```

Deben aparecer las seis cabeceras y un `200` (la ruta la resuelve la SPA). Después, en el navegador: crear una cuenta, confirmar el correo, iniciar sesión, cerrar sesión, y revisar que la consola no muestra infracciones de CSP.

## Qué hace `web/vercel.json`
- Reescribe cualquier ruta que no sea un archivo de `/assets/` a `index.html` (rutas de la SPA).
- Añade las cabeceras de seguridad descritas en [seguridad.md](seguridad.md). `connect-src` permite `*.supabase.co` de forma genérica para no escribir el proyecto concreto en el repositorio.
- Cachea `/assets/*` sin caducidad (los nombres llevan hash).

Si se cambia la CSP aquí, hay que cambiarla también en `web/nginx.conf`, que la replica para la vista previa local.

## Notas
- Con un dominio propio para Supabase, añade ese dominio a `connect-src` en `vercel.json`.
- En las vistas previas, la barra de herramientas de Vercel puede quedar bloqueada por la CSP; es lo esperado y no afecta a la app.
- Secretos que aparezcan en el futuro (por ejemplo, para funciones del lado servidor) irán como variables **sin** prefijo `VITE_` en Vercel o como secretos de Supabase, nunca en el repositorio.
