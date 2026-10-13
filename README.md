# Kalo (En proceso)

App de nutrición y hábitos con IA: registro de comida (foto + IA o manual), agua, ejercicio, sueño y peso, con calorías y proteína como metas principales y un asistente que actúa como nutriólogo.

## Estructura

| Carpeta | Contenido |
|---|---|
| `web/` | App web en React + Vite + TypeScript (laptop y móvil) |
| `mobile/` | App móvil en Flutter (iOS y Android) |
| `docs/` | Documentación de avance y técnica |
| `design/` | Diseño de referencia: un HTML por pantalla (`*.dc.html`) |
| `assets/` | Mascota/logo (`kalo-mascot.png`) |
| `CLAUDE.md` | Especificación: identidad, pantallas, reglas de dominio, IA |

## Web en local (Docker)

```bash
docker compose up web
```

Abre <http://localhost:5173>. Para probar el build de producción con sus cabeceras de seguridad:

```bash
docker compose --profile preview up --build web-preview
```

Abre <http://localhost:8080>. Más detalles en [docs/tecnica/entorno-local.md](docs/tecnica/entorno-local.md).

## Móvil

```bash
cd mobile
flutter pub get
flutter run
```

## Documentación

- [Hoja de ruta](docs/avance/hoja-de-ruta.md) y [bitácora](docs/avance/bitacora.md)
- [Arquitectura](docs/tecnica/arquitectura.md), [entorno local](docs/tecnica/entorno-local.md) y [seguridad](docs/tecnica/seguridad.md)

## Antes del primer commit

El repositorio es público. Activa el escaneo de secretos una vez por clon:

```bash
brew install gitleaks
git config core.hooksPath .githooks
```
