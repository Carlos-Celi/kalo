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
| Reconstruir tras cambiar `package.json` desde el host | `docker compose down -v` y después `docker compose up --build web` |

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

## Variables de entorno
Copia `web/.env.example` a `web/.env.local`. Ese archivo está ignorado por git. Todo lo que empieza por `VITE_` se incrusta en el JavaScript público: ahí nunca va un secreto (ver [seguridad](seguridad.md)).

## Hook de git contra secretos
Una vez por clon:

```bash
brew install gitleaks
git config core.hooksPath .githooks
```

Desde entonces cada commit se escanea antes de crearse.
