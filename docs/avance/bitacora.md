# Bitácora de avance

Las entradas más recientes van arriba.

## 2026-10-13 · Web, entrega 3: onboarding

**Hecho**
- Las cinco pantallas del onboarding según el diseño: Perfil, Medidas, Objetivos, Hábitos y el plan con metas ajustables (`/bienvenida/…`). En escritorio se muestran en una tarjeta centrada, como el login.
- Quien inicia sesión sin plan pasa primero por el onboarding; no se puede saltar pasos por la URL. Desde Configuración se puede rehacer el plan con los datos actuales.
- Cálculo del plan con reglas fijas (Mifflin-St Jeor, proteína por kilo, agua por kilo): ver [ADR 0004](../tecnica/decisiones/0004-plan-calculado-sin-ia.md).
- Migración `20261013000000_onboarding.sql`: datos del perfil y metas en `perfiles`, con `check` por columna, permisos de escritura solo sobre esas columnas y una restricción que impide marcar el onboarding como completo con datos a medias.
- Inicio usa el nombre y las metas reales del usuario; los registros del día siguen siendo de ejemplo.
- Seed con dos cuentas: `prueba@kalo.test` (plan completo) y `nuevo@kalo.test` (entra al onboarding).
- El proyecto de Docker Compose pasa a llamarse `kalo-web`: compartía nombre con el de Supabase y su CLI borraba el contenedor de la web en cada `supabase stop` o `supabase db reset`.

**Verificado (contra Supabase local)**
- Lint, tipos, 54 pruebas y build en verde.
- En el navegador a 390 px y en escritorio: recorrido completo con `nuevo@kalo.test`, plan guardado en la base de datos, Inicio con el nombre y las metas nuevas, y el plan visible en Configuración tras recargar.
- Por API con las dos cuentas: cada una lee solo su fila; editar la de otra no afecta a ninguna fila; valores fuera de rango, restricciones inventadas, `creado_en` y el onboarding "completo" con datos a medias quedan rechazados; como anónimo, sin acceso.

**Diferencias deliberadas respecto al diseño**
- Sin IA todavía: "Generar mi plan" y "Sugerido para ti" en lugar de "…con IA" y "Sugerido por la IA".
- Sexo, objetivo y hábitos empiezan sin selección (en el diseño vienen marcados los datos de ejemplo) y son obligatorios, salvo las restricciones.
- En el primer paso, la flecha de volver cierra la sesión: con sesión iniciada no se puede volver al login.
- Los chips miden 44 px de alto (42 en el diseño de Hábitos) por el objetivo táctil mínimo.

**Sin verificar**
- La vista previa de producción (no cambiaron cabeceras ni dependencias) y el despliegue real.

**Pendiente / siguiente**
- Decisión de producto: edad mínima (ahora 16) y si el plan debe generarlo la IA cuando exista.
- Editar perfil y metas campo a campo desde Configuración (entrega 5); por ahora se rehace el plan entero.
- Entrega 4: Registros con persistencia.

## 2026-10-13 · Entorno local: cuenta de prueba (seed)

**Hecho**
- `supabase/seed.sql`: crea una cuenta ya confirmada (`prueba@kalo.test`) con su perfil, para entrar en local sin pasar por el correo. Se carga con `supabase start` y `supabase db reset`; no se aplica al proyecto remoto.
- `docs/tecnica/entorno-local.md`: cuenta de prueba, uso de `npx supabase` sin instalar la CLI y qué revisar cuando el formulario de acceso no deja crear cuentas.

**Diagnóstico**
- "No permite crear usuarios" en una máquina recién clonada no era un fallo del registro: faltaban Supabase local y `web/.env.local`, así que la web estaba en modo demostración, que deshabilita el formulario.

**Verificado (Windows, contra Supabase local)**
- Lint, tipos, 37 pruebas y build en verde.
- En el navegador: inicio de sesión con la cuenta del seed (Inicio saluda con el nombre del perfil) y registro de una cuenta nueva desde `/login` con su correo en la bandeja de pruebas.
- Por API: el perfil del seed solo se lee con su sesión; como anónimo, 401.

**Sin verificar**
- La confirmación de la cuenta nueva abriendo el enlace del correo (ya se comprobó en la entrega 2).

## 2026-10-12 · Web, entrega 2: Vercel y Supabase

**Hecho**
- `web/vercel.json`: fallback de SPA, cabeceras de seguridad (CSP, HSTS y el resto) y caché de `/assets`. La CSP se replica en `web/nginx.conf` para la vista previa local.
- `supabase/`: configuración local endurecida (confirmación de correo, contraseña mínima de 8, cambio de contraseña seguro) y primera migración: tabla `perfiles` con RLS, sin acceso anónimo, permisos por columna y disparador que crea el perfil al registrarse.
- Cliente de Supabase con flujo PKCE y validación de la configuración al arrancar: la app se detiene si recibe una clave secreta.
- **Login** según el diseño: iniciar sesión, crear cuenta y recuperar contraseña (`/login`, `/restablecer`), con rutas protegidas, cierre de sesión en Configuración, mensajes de error genéricos, freno progresivo de reintentos y CAPTCHA opcional con Turnstile.
- Modo demostración: sin variables de Supabase la app funciona sin cuentas y con datos de ejemplo.
- Inicio lee el nombre del perfil desde Supabase; el contenedor de desarrollo sincroniza dependencias al arrancar.
- Documentación: guía de despliegue, ADR 0003 (autenticación) y seguridad actualizada.

**Verificado (contra Supabase local)**
- Lint, tipos, 37 pruebas y build en verde.
- RLS con dos usuarios: cada uno ve y edita solo su perfil; insertar, borrar, cambiar el `id`, invocar la función `security definer` y leer como anónimo quedan denegados.
- En el navegador: registro, correo de confirmación, inicio de sesión, error genérico con contraseña incorrecta, cierre de sesión, recuperación de contraseña y redirección a `/login` sin sesión.
- Build de producción con Supabase detrás de nginx: sin infracciones de CSP.
- CAPTCHA con las claves de prueba de Cloudflare: el servidor rechaza peticiones sin token y el inicio de sesión desde la app pasa.

**Sin verificar**
- El despliegue real: faltan los proyectos de Vercel y Supabase (pasos en `docs/tecnica/despliegue.md`).
- El CAPTCHA bajo la CSP de producción y la protección de contraseñas filtradas (depende del plan de Supabase).

**Pendiente / siguiente**
- Crear los proyectos en Vercel y Supabase y comprobar el despliegue.
- Entrega 3: onboarding (hasta entonces el saludo de Inicio no muestra nombre y los datos del día son de ejemplo).

## 2026-10-12 · Web, entrega 1: base local e Inicio

**Hecho**
- Entorno local con Docker: servicio de desarrollo con recarga en caliente (`localhost:5173`) y servicio de vista previa con el build de producción detrás de nginx (`localhost:8080`).
- Carpeta `docs/` con hoja de ruta, bitácora, arquitectura, entorno local, seguridad y dos decisiones (ADR).
- Tema de la marca como tokens de Tailwind: colores, tipografía Plus Jakarta Sans autoalojada, radios y estilos globales del diseño (foco, pulsación, movimiento reducido).
- Componentes base: `Button`, `Chip`, `Badge`, `Icon`, `MascotAvatar`, `ProgressRing`, `ProgressBar`, `BarChart`.
- Navegación: tab bar en móvil y barra lateral en escritorio (desde 1024 px), con todas las rutas enlazadas.
- Pantalla **Inicio** completa con los datos de ejemplo del diseño: saludo, anillos de calorías y proteína, siguiente paso, cuatro hábitos y barras de 7 días. En escritorio se reordena en varias columnas.
- Reglas de dominio (estado del anillo, IMC) y formato numérico en español, con pruebas.
- Protección del repositorio: `.gitignore` de secretos, escaneo con gitleaks (hook local y CI), Dependabot y CI de la web.

**Verificado**
- Lint, comprobación de tipos, 17 pruebas y build en verde.
- Inicio revisada en el navegador a 390 px contra `design/Inicio.dc.html` y a 1440 px.
- Vista previa de producción: cabeceras de seguridad presentes, CSP sin infracciones, rutas profundas resueltas por el fallback de SPA, nginx sin privilegios de root.

**Diferencias deliberadas respecto al diseño**
- El margen superior de 52 px del diseño reserva la barra de estado del teléfono; en web se usa 20 px más el área segura del dispositivo.
- El tab bar ajusta su relleno inferior al área segura en lugar de los 20 px fijos.
- En escritorio la campana y la configuración pasan del encabezado a la barra lateral.

**Pendiente / siguiente**
- Entrega 2: Vercel y Supabase (login real, esquema con RLS).
- Los datos de Inicio son de ejemplo: todavía no hay persistencia.
- `zustand` no se añadió aún: no hay estado compartido que lo justifique; se incorporará con la persistencia.
