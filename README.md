# Kalo

App de nutrición y hábitos con IA: registro de comida (foto + IA o manual), agua, ejercicio, sueño y peso, con calorías y proteína como metas principales y un asistente que actúa como nutriólogo.

## Estructura

| Carpeta | Contenido |
|---|---|
| `mobile/` | App móvil en Flutter (iOS y Android) |
| `web/` | App web en React + Vite + TypeScript (laptop y móvil) |
| `design/` | Diseño de referencia: un HTML por pantalla (`*.dc.html`) |
| `assets/` | Mascota/logo (`kalo-mascot.png`) |
| `CLAUDE.md` | Especificación: identidad, pantallas, reglas de dominio, IA |

## Móvil

```bash
cd mobile
flutter pub get
flutter run
```

## Web

```bash
cd web
npm install
npm run dev
```
