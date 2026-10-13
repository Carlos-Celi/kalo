# Entorno local con Docker

Requisito: Docker Desktop abierto. Todos los comandos se ejecutan desde la raíz del repositorio.

## Desarrollo (recarga en caliente)

```bash
docker compose up web
```

Abre <http://localhost:5173>. El código de `web/` está montado en el contenedor: al guardar un archivo, el navegador se actualiza.

## Vista previa de producción

```bash
docker compose --profile preview up --build web-preview
```

Abre <http://localhost:8080>. Sirve el build optimizado detrás de nginx con las mismas cabeceras de seguridad que el despliegue. Úsalo antes de publicar para detectar lo que solo falla en producción (por ejemplo, infracciones de la CSP).

## Tareas habituales

| Necesito… | Comando |
|---|---|
| Ejecutar las pruebas | `docker compose exec web npm test` |
| Lint y tipos | `docker compose exec web npm run lint` · `docker compose exec web npm run typecheck` |
| Instalar una dependencia | `docker compose exec web npm install <paquete>` |
| Ver los registros | `docker compose logs -f web` |
| Parar todo | `docker compose --profile preview down` |
| Aplicar un `package.json` cambiado desde el host | `docker compose restart web` (al arrancar sincroniza las dependencias) |
| Empezar de cero | `docker compose down -v` y después `docker compose up --build web` |

## Cómo está montado
- `web/Dockerfile` tiene varias etapas: `deps` (instala con `npm ci`), `dev` (Vite), `build` (compila) y `preview` (nginx sin privilegios sirviendo `dist/`).
- Las dependencias viven en un volumen del contenedor (`web_node_modules`), no en el `node_modules` del host: los binarios nativos son de Linux y no se mezclan con los de macOS.
- Los contenedores no se ejecutan como root. El de vista previa además tiene el sistema de archivos en solo lectura y sin capacidades.
- Los puertos se publican solo en `127.0.0.1`: otros equipos de la red no pueden abrir la app.
- La variable `KALO_DOCKER=1` hace que Vite escuche en todas las interfaces del contenedor y vigile los archivos por sondeo.

## Sin Docker
También funciona directamente con Node 24 o superior:

```bash
cd web
npm install
npm run dev
```

## Cuentas en local: Supabase

Sin configurar nada, la app arranca en **modo demostración** (sin login, datos de ejemplo). Para probar el registro y el inicio de sesión se levanta Supabase en local, también con Docker:

```bash
brew install supabase/tap/supabase
supabase start
```

La primera vez descarga varias imágenes. Al terminar, `supabase status` muestra la *API URL* y la *Publishable key*: cópialas en `web/.env.local` (parte de `web/.env.example`) y reinicia el servicio `web`.

| Qué | Dónde |
|---|---|
| API de Supabase | <http://127.0.0.1:54321> |
| Studio (tablas, usuarios, SQL) | <http://127.0.0.1:54323> |
| Bandeja de correo de pruebas (confirmaciones, recuperación) | <http://127.0.0.1:54324> |

En local no se envía correo real: los enlaces de confirmación llegan a esa bandeja.

Sin instalar la CLI también sirve `npx supabase <comando>` (por ejemplo en Windows, donde no hay `brew`).

### Cuenta de prueba (seed)

`supabase/seed.sql` crea dos cuentas ya confirmadas, para entrar sin pasar por el correo. Contraseña de ambas: `kalo-local-1234`.

| Correo | Estado |
|---|---|
| `prueba@kalo.test` | Onboarding completo: entra directo a Inicio |
| `nuevo@kalo.test` | Recién registrada: entra al onboarding |

Se cargan al crear la base de datos (`supabase start` la primera vez) y cada vez que se ejecuta `supabase db reset`. Solo existen en local: el seed no se aplica al proyecto remoto.

### Si el formulario de acceso está deshabilitado o no deja crear cuentas

- **Aviso "Modo demostración" y campos deshabilitados:** la web no tiene configurado Supabase. Falta `web/.env.local` o no se reinició el servicio `web` después de crearlo.
- **"Demasiados intentos":** se superaron los 30 registros o inicios de sesión en 5 minutos desde la misma IP. Espera o usa la cuenta de prueba. (El límite de 2 correos por hora de `config.toml` solo aplica con un SMTP propio; con la bandeja de pruebas no se alcanza.)
- **"No pudimos completar la operación":** Supabase no está levantado (`supabase status`).
- **Inicio dice "No pudimos cargar tu resumen" o el asistente "No pudimos completar la petición" tras actualizar el código:** la base local no tiene las migraciones nuevas (la web consulta tablas y columnas que aún no existen). Aplícalas con `supabase migration up` (o `supabase db reset` si no te importan los datos locales) y recarga.
- **La cuenta se crea pero no deja entrar:** falta confirmar el correo desde la bandeja de pruebas, en el mismo navegador que hizo el registro.

| Necesito… | Comando |
|---|---|
| Recrear la base de datos desde las migraciones y el seed | `supabase db reset` |
| Aplicar una migración nueva sin borrar los datos | `supabase migration up` |
| Crear una migración | `supabase migration new <nombre>` |
| Parar Supabase | `supabase stop` |
| Vista previa de producción con Supabase | `docker compose --env-file web/.env.local --profile preview up --build web-preview` |

La configuración local está en `supabase/config.toml` (confirmación de correo obligatoria, contraseña mínima de 8, servicios que aún no se usan desactivados). Las claves que imprime `supabase start` son las de demostración de Supabase, iguales en cualquier máquina: sirven solo en local.

## Variables de entorno
Copia `web/.env.example` a `web/.env.local`. Ese archivo está ignorado por git. Todo lo que empieza por `VITE_` se incrusta en el JavaScript público: ahí nunca va un secreto (ver [seguridad](seguridad.md)).

## Hook de git contra secretos
Una vez por clon:

```bash
brew install gitleaks
git config core.hooksPath .githooks
```

Desde entonces cada commit se escanea antes de crearse.
