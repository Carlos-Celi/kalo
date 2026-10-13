# Hoja de ruta

Estados: ✅ hecho · 🚧 en curso · ⏳ pendiente

## Web (`web/`)

| # | Entrega | Estado |
|---|---|---|
| 1 | Base local: Docker, documentación, tema, componentes, navegación e Inicio con datos de ejemplo | ✅ |
| 2 | Vercel y Supabase: cabeceras de despliegue, esquema con RLS y login real | ✅ código · ⏳ crear los proyectos en Vercel y Supabase |
| 3 | Onboarding: Perfil, Medidas, Objetivos, Hábitos, Metas | ✅ |
| 4 | Registros (Comida, Agua, Ejercicio, Sueño), Registro rápido y Peso, con persistencia | ✅ |
| 5 | Progreso (gráficas con datos reales), Recordatorios y Ajustes | ✅ |
| 6 | IA: Proveedor de IA, Cámara + Análisis, Manual y Asistente | ✅ código · ⏳ probar con una API key real de cada proveedor |
| 7 | Pulido: accesibilidad, rendimiento y pruebas de extremo a extremo | ⏳ |
| 8 | Correcciones de la primera revisión: asistente completo con chats, Configuración con pantallas propias, sueño con siestas, ejercicio con calorías manuales, IA al empezar, formularios en horizontal | ✅ |
| 9 | Recordatorios por correo (Edge Function + Resend) | ✅ código · ⏳ desplegar la función y probar con Resend ([guía](../tecnica/recordatorios-por-correo.md)) |
| 10 | Revisión de UI/UX: hoja de registro rápido anclada a la ventana, Registros móvil más compacto, asistente sin IA, atajo de agua en Inicio, peso con mantener pulsado y escritura, contraste y nuevas imágenes de la mascota ([ADR 0009](../tecnica/decisiones/0009-revision-ui-ux.md)) | ✅ web · ⏳ replicar en `mobile/` |

### Pantallas

| Pantalla | Diseño de referencia | Ruta | Estado |
|---|---|---|---|
| Inicio | `Inicio.dc.html` | `/` | ✅ |
| Login (iniciar sesión, crear cuenta, recuperar contraseña) | `Login.dc.html` | `/login`, `/restablecer` | ✅ |
| Perfil, Medidas, Objetivos, Hábitos, Metas | `Perfil`, `Medidas`, `Objetivos`, `Habitos`, `Metas` | `/bienvenida`, `/bienvenida/medidas`, `/bienvenida/objetivos`, `/bienvenida/habitos`, `/bienvenida/plan` | ✅ plan por fórmula, sin IA |
| Registros | `Registros.dc.html` y variantes | `/registros`, `/registros/agua`, `/registros/ejercicio`, `/registros/sueno` | ✅ |
| Manual (alta y edición de una comida) | `Manual.dc.html` | `/registros/comida/manual`, `/registros/comida/:id` | ✅ |
| Foto con IA | `Camara.dc.html` | `/registros/comida/foto` | ✅ sin probar con cámara y proveedor reales |
| Resultado de la IA | `Analisis.dc.html` | `/registros/comida/analisis` | ✅ sin probar con un proveedor real |
| Registro rápido | `Mas.dc.html` | `/registro-rapido` | ✅ |
| Peso | `Peso.dc.html` | `/peso` | ✅ |
| Asistente (pantalla completa, 3 chats, 20 mensajes por chat) | `Asistente.dc.html` | `/asistente` | ✅ sin probar con un proveedor real |
| Proveedor de IA | `ProveedorIA.dc.html` | `/ajustes/ia`, `/bienvenida/ia` (paso del onboarding) | ✅ sin probar con un proveedor real |
| Progreso | `Progreso.dc.html` | `/progreso` | ✅ |
| Recordatorios | `Recordatorios.dc.html` | `/recordatorios` | ✅ navegador y correo (el correo requiere desplegar la función) |
| Configuración | `Ajustes.dc.html` | `/ajustes` | ✅ |
| Perfil, Medidas y peso, Objetivo y hábitos, Metas diarias (edición dentro de Configuración) | sin diseño propio: reutilizan los componentes de Configuración y del onboarding | `/ajustes/perfil`, `/ajustes/medidas`, `/ajustes/objetivo`, `/ajustes/metas` | ✅ |

Ya no quedan pantallas en construcción en la web. Lo pendiente es la entrega 7 y las pruebas con servicios reales (despliegue y proveedores de IA).

## Móvil (`mobile/`)

| Entrega | Estado |
|---|---|
| Proyecto Flutter creado (plantilla) | ✅ |
| Tema, navegación y pantallas | ⏳ después de la web |
