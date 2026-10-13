# Hoja de ruta

Estados: ✅ hecho · 🚧 en curso · ⏳ pendiente

## Web (`web/`)

| # | Entrega | Estado |
|---|---|---|
| 1 | Base local: Docker, documentación, tema, componentes, navegación e Inicio con datos de ejemplo | ✅ |
| 2 | Despliegue en Vercel y Supabase: cabeceras, esquema con RLS y login real | ⏳ |
| 3 | Onboarding: Perfil, Medidas, Objetivos, Hábitos, Metas | ⏳ |
| 4 | Registros (Comida, Agua, Ejercicio, Sueño), Registro rápido y Peso, con persistencia | ⏳ |
| 5 | Progreso (gráficas con datos reales), Recordatorios y Ajustes | ⏳ |
| 6 | IA: Proveedor de IA, Cámara + Análisis, Manual y Asistente | ⏳ |
| 7 | Pulido: accesibilidad, rendimiento y pruebas de extremo a extremo | ⏳ |

### Pantallas

| Pantalla | Diseño de referencia | Ruta | Estado |
|---|---|---|---|
| Inicio | `Inicio.dc.html` | `/` | ✅ datos de ejemplo |
| Login | `Login.dc.html` | `/login` | ⏳ marcador |
| Perfil, Medidas, Objetivos, Hábitos, Metas | `Perfil`, `Medidas`, `Objetivos`, `Habitos`, `Metas` | — | ⏳ |
| Registros | `Registros.dc.html` y variantes | `/registros`, `/registros/agua`, `/registros/ejercicio`, `/registros/sueno` | ⏳ marcador |
| Foto con IA | `Camara.dc.html` | `/registros/comida/foto` | ⏳ marcador |
| Resultado de la IA, Manual | `Analisis.dc.html`, `Manual.dc.html` | — | ⏳ |
| Registro rápido | `Mas.dc.html` | `/registro-rapido` | ⏳ marcador |
| Peso | `Peso.dc.html` | — | ⏳ |
| Asistente | `Asistente.dc.html` | `/asistente` | ⏳ marcador |
| Proveedor de IA | `ProveedorIA.dc.html` | — | ⏳ |
| Progreso | `Progreso.dc.html` | `/progreso` | ⏳ marcador |
| Recordatorios | `Recordatorios.dc.html` | `/recordatorios` | ⏳ marcador |
| Configuración | `Ajustes.dc.html` | `/ajustes` | ⏳ marcador |

"Marcador" significa que la ruta existe y es navegable, pero muestra una pantalla de "en construcción".

## Móvil (`mobile/`)

| Entrega | Estado |
|---|---|
| Proyecto Flutter creado (plantilla) | ✅ |
| Tema, navegación y pantallas | ⏳ después de la web |
