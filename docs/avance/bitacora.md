# Bitácora de avance

Las entradas más recientes van arriba.

## 2026-10-13 · Revisión de UI/UX y nuevas imágenes de la mascota

**Qué pasaba**
- La hoja de Registro rápido se desbordaba en móvil (390×844): `animate-aparecer` dejaba un `transform` aplicado y la hoja `fixed` se anclaba al contenedor de la pantalla en vez de a la ventana, de modo que Sueño y Peso quedaban fuera de pantalla y Agua y Ejercicio bajo el tab bar.
- En Registros móvil la acción quedaba bajo ~500 px de cabecera, racha, selector, semana, leyenda y nota; en el Asistente la cabecera partía el título y cortaba el subtítulo, y sin IA se veían sugerencias deshabilitadas con el aviso al final.

**Hecho** ([ADR 0009](../tecnica/decisiones/0009-revision-ui-ux.md))
- Hoja anclada a la ventana (entrada de ruta solo con opacidad, `z-40`, foco atrapado).
- Registros: racha dentro de la tarjeta de la semana, leyenda y nota plegables en móvil, secciones más bajas y fecha como texto.
- Asistente: cabecera de una línea, icono de reloj, aviso de conectar IA primero, sin `aria-live` sobre el texto en streaming.
- Cámara: registrar a mano como salida principal sin IA y tipos de comida en una fila con desplazamiento.
- Inicio: «+250 ml» con «Deshacer» en el mosaico de agua. Peso: repetir al mantener pulsado, escribir el valor y meta en la gráfica.
- «Reintentar» en los errores de carga de Inicio, Registros y Progreso.
- Contraste: placeholder, pestaña activa, día elegido y texto pequeño de la tarjeta naranja.
- **Imágenes**: `Kalo.png` (llama sin fondo) en los avatares y `kalo-mascot-b.png` (ícono a sangre) en el logotipo del acceso, las notificaciones, el favicon y el `apple-touch-icon`. Se retira `web/src/assets/kalo-mascot.png`.

**Verificado**
- Lint, tipos, build y 132 pruebas en verde (nuevas: atajo de agua, peso escrito, hoja anclada con foco atrapado, ayuda plegable de la semana, «Registrar a mano» sin IA).
- En el navegador a 390 px: la hoja mide 844 px y sus cuatro accesos caben; Registros, Asistente sin IA, Cámara sin IA, Inicio con atajo de agua y acceso con el nuevo logotipo.

**Sin verificar**
- Dispositivos reales (área segura, teclado en el campo de peso, mantener pulsado con el dedo).
- El lector de pantalla con una respuesta real del asistente.
- `mobile/` no recibió estos cambios.

## 2026-10-14 · Foto en el análisis, gráfica de Inicio con selector, cantidad editable y animaciones

**Qué pasaba**
- La foto no aparecía en el resultado del análisis: al añadir el contenedor en dos columnas, el lienzo se volvía a montar al pasar de «analizando» a «resultado» y no se repintaba. Ahora se pinta con una referencia de función (cada montaje la recibe) y hay una prueba que lo protege.

**Hecho**
- **Gráfica de Inicio con selector** Calorías · Proteína · Agua (`GraficaSemana`): mismo gráfico de 7 días con su meta como línea discontinua y el color de cada hábito.
- **Cantidad editable**: se escribe o se ajusta de media en media (0,5 – 50); los totales se recalculan sin volver a llamar a la IA y la porción se actualiza.
- **Animaciones** (respetan «reducir movimiento»): escáner sobre la foto mientras la IA analiza (rayo, rejilla, esquinas y mensajes que cambian), calorías que suben al aparecer el resultado, anillos y barras que se llenan, barras de la gráfica que crecen, fundido al cambiar de pantalla, mensajes del asistente que aparecen y tres puntos mientras responde.
- Pruebas más tolerantes a la carga de la máquina (`testTimeout` y `asyncUtilTimeout`): fallaban a veces por tiempo, no por error.

**Verificado**
- Lint, tipos, build y 128 pruebas en verde.
- En el navegador: escáner con foto de prueba y selector de la gráfica en escritorio.

**Sin verificar**
- La animación del resultado con una respuesta real de la IA (el resultado se probó en pruebas, no en el navegador).

## 2026-10-14 · Cantidades en el análisis de fotos, alcohol solo en snacks y licores, fotos ultracomprimidas

**Hecho**
- **Cantidades.** La IA cuenta las unidades de la foto (dos panes con huevo son 2) y devuelve los totales de todas ellas, con `cantidad` y `unidad`. El resultado muestra «Cantidad detectada · ≈ 150 kcal c/u» con un selector para corregirla: los totales se reescalan sin volver a llamar a la IA (`escalarAnalisis`). El prompt, el esquema estructurado y el formato de Gemini incluyen los campos nuevos.
- **Alcohol.** La marca «bebida con alcohol» solo aparece en snack y licor; al pasar a desayuno, almuerzo o cena se descarta, y la validación y la base de datos (`check … not valid`) lo hacen cumplir.
- **Fotos ultracomprimidas** ([ADR 0008](../tecnica/decisiones/0008-fotos-de-comida-ultracomprimidas.md)). Miniatura WebP de ≤ 480 px (≈ 10–30 KB) guardada con la comida si se deja activado el interruptor del análisis; se ve al abrir la comida, la lista marca las comidas con foto y se puede quitar.
- Migración `20261014020000_fotos_de_comida.sql`.

**Verificado**
- Lint, tipos y 128 pruebas en verde (nuevas: reescalado de cantidades, corrección de la cantidad en pantalla, alcohol por tipo, foto guardada, listada y quitada).
- Migración aplicada a la base local y comprobada por la API: insertar con foto, listar sin descargarla, pedirla, quitarla, rechazo de foto con formato o tamaño inválido, y rechazo de alcohol en un desayuno.

**Sin verificar**
- Qué tan bien cuenta unidades cada proveedor real: el prompt lo pide explícitamente, pero hay que probarlo con fotos reales.
- La compresión a WebP con la cámara y un navegador real (en las pruebas el lienzo no existe); el límite de tamaño y el JPEG de respaldo están en código, no probados con imágenes.

## 2026-10-14 · Correcciones de la primera revisión: asistente completo, Configuración con pantallas propias, sueño y ejercicio, recordatorios por correo

**Qué se pidió y qué se hizo**

- **Vistas adaptadas a web y móvil, formularios en horizontal.** Las pantallas de un solo propósito (`PantallaFlujo`) y el onboarding pasan de una columna de 480 px a una tarjeta de 720–1000 px desde 640 px de ancho, y sus formularios se reparten en columnas: alta manual de comida (datos a la izquierda, nutrientes a la derecha), análisis de IA (foto + resultado), peso (registro + gráfica), proveedor de IA, metas y medidas. El inicio de sesión pasa a dos paneles (marca + formulario) desde 768 px.
- **El asistente cubre la pantalla** (sin márgenes ni ancho máximo, `handle: { pantallaCompleta }` en la ruta), con el historial de chats a la izquierda en escritorio y como panel en móvil.
- **Chats con límite e historial.** 20 mensajes por chat, "Chat nuevo" y los 3 chats más recientes, guardados en el dispositivo ([ADR 0007](../tecnica/decisiones/0007-asistente-con-datos-completos-y-chats-locales.md)).
- **Asistente completo.** Lee todo lo registrado (comidas con macros, agua, ejercicio, sueño y siestas, 14 días de historial, peso, metas, recordatorios), responde con planes, menús, recetas y análisis, y da formato a las respuestas (listas, negritas, tablas).
- **Recordatorios por correo.** Interruptor "Por correo" en Recordatorios; los recordatorios pasan a Supabase y una Edge Function programada envía el correo con Resend ([ADR 0006](../tecnica/decisiones/0006-recordatorios-por-correo.md), [guía](../tecnica/recordatorios-por-correo.md)).
- **Configuración de IA al empezar.** Nuevo último paso del onboarding (`/bienvenida/ia`) con la opción "Configurarla más tarde"; el mismo formulario sirve desde Configuración.
- **Editar metas, estatura o peso ya no abre el onboarding.** Pantallas propias dentro de Configuración: `/ajustes/perfil`, `/ajustes/medidas` (el peso queda también en el historial de hoy), `/ajustes/objetivo` y `/ajustes/metas` (con "Usar las sugeridas").
- **Sueño.** Se registra la noche por horario (me dormí a las / desperté a las, cruzando la medianoche) o por duración, para anoche o antenoche, y se suman **siestas** del día (varias, con atajos y duración libre). Todo cuenta para la meta de sueño.
- **Ejercicio.** Sesión con actividad, horas y minutos, y **calorías manuales** (reloj o pulsera) o estimadas si se dejan vacías; cada sesión indica "Tu medición" o "Estimado" y se puede eliminar.
- **Diseño.** Elevación suave en las tarjetas, tarjeta principal de Inicio con degradado, perfil en la barra lateral, tab bar translúcido, esqueletos de carga y marco de acceso con panel de marca.

**Cambios de esquema** (`supabase/migrations/`): `20261014000000_siestas_y_ejercicio_manual.sql` (tabla `siestas`, `ejercicios.kcal_origen`, `resumen_diario` suma siestas) y `20261014010000_recordatorios_correo.sql` (`recordatorios`, `avisos_enviados`, `perfiles.avisos_correo` y `zona_horaria`).

**Verificado**
- Lint, tipos y 121 pruebas de la web en verde (nuevas: totales con siestas, duración del sueño, ejercicio manual, chats e historial, límite de mensajes, contexto del asistente, Markdown, pantallas de edición de Configuración, paso de IA del onboarding).
- Lógica de los avisos por correo: 10 pruebas con Node (`node --test supabase/functions/_shared/avisos.test.ts`).
- En el navegador (modo demostración, ancho de móvil): Sueño, Ejercicio, Metas diarias y Asistente.

**Sin verificar**
- La Edge Function contra Supabase y Resend reales, y las migraciones nuevas contra una base real (`supabase db reset` / `db push`).
- El asistente con un proveedor real: el prompt y el tamaño del contexto se ajustarán con uso real.
- Las vistas de escritorio se revisaron por estructura (rejillas y anchos), no a 1440 px en el navegador.

**Decisiones tuyas**
- "Límite de sesión" se entendió como tope de mensajes por chat (20). Si se prefiere caducidad por inactividad, es un cambio pequeño en `domain/chats.ts`.

## 2026-10-13 · Corrección: pantalla en blanco al cambiar de modelo en "Proveedor de IA"

**Qué pasaba**
- Con una lista larga de modelos (Google devuelve decenas), elegir uno de la parte baja dejaba la pantalla en blanco.
- Causa: los radios de la lista son `sr-only` (posición absoluta) y el contenedor con scroll no era `relative`. Los 40 radios agrandaban la página (2.877 px frente a 974 px) y, al enfocar el elegido, la ventana saltaba a esa zona vacía. Es la causa real de la pantalla en blanco que la entrada anterior no pudo reproducir.

**Hecho**
- La lista de modelos es `relative`: los radios quedan dentro de su contenedor, la página mide lo que debe y no salta.

**Verificado**
- En el navegador, con la respuesta de Google simulada (40 modelos, clave inventada): antes, al elegir el modelo 31 el scroll saltaba de 466 a 2061 px y la pantalla quedaba vacía; después, la página sigue en su sitio al elegir el 36. Lint, tipos y 99 pruebas en verde.

**Sin verificar**
- Con la clave real de Google; la comprobación se hizo con una respuesta simulada del listado.

## 2026-10-13 · Corrección: "Probar conexión" fallaba con una clave válida de Google

**Qué pasaba**
- Google responde 400 (no 401) a una clave inválida y Kalo lo mostraba como "modelo no disponible".
- El campo de la API key era `type="password"` y además se rellenaba con la clave ya guardada, oculta tras puntos: al pegar una clave nueva se añadía a lo que hubiera (la clave anterior o lo que pusiera el gestor de contraseñas del navegador) y el proveedor la rechazaba.

**Hecho**
- El campo ya no se rellena con la clave guardada: muestra "Clave guardada · pega otra para cambiarla" y la conserva mientras no se escriba otra.
- El campo es de texto enmascarado por CSS, para que el gestor de contraseñas no lo toque, y se quitan los espacios y saltos de línea al pegar.
- Los errores de Google se clasifican por su código (`API_KEY_INVALID`, `PERMISSION_DENIED`…), y el aviso de "Probar conexión" enseña el código técnico del proveedor (nunca su mensaje) para poder diagnosticar.

**Verificado**
- Con una clave real de Google facilitada para la prueba: el cliente de Kalo, ejecutado en el navegador, lista 34 modelos (entre ellos `gemini-3.5-flash`) y `generateContent` responde 200. Primera comprobación del cliente de Google contra el servicio real.
- En la pantalla, con un texto inventado: campo enmascarado y aviso "Tu proveedor rechazó la API key · HTTP 400 · API_KEY_INVALID". 99 pruebas, lint, tipos y build en verde.

**Sin verificar**
- El recorrido completo en la pantalla con la clave real (no se teclean credenciales en formularios desde la automatización), ni el análisis de una foto ni el asistente con Google. La respuesta en streaming devolvió 503 en la única prueba.

## 2026-10-13 · Corrección: pantalla en blanco en "Proveedor de IA"

**Qué pasaba**
- En desarrollo, la primera vez que se usaba Anthropic el servidor de Vite descubría el SDK a mitad de sesión, lo empaquetaba y recargaba la página: la configuración a medias se perdía y la pantalla podía quedar en blanco. No ocurre en el build de producción.
- Al volver a "Proveedor de IA" solo aparecía el modelo guardado; para elegir otro había que adivinar que tocaba pulsar "Probar conexión".

**Hecho**
- `vite.config.ts` prepara el SDK y `zod` al arrancar (`optimizeDeps.include`), así no hay recarga a mitad de sesión.
- La pantalla carga sola la lista de modelos al abrirse con una clave guardada.
- `app/PantallaError`: si una pantalla falla al pintarse o al cargar su código, se muestra un aviso con "Recargar" en lugar de una página en blanco.

**Verificado**
- En el navegador, con las llamadas al proveedor interceptadas (sin enviar nada fuera): probar conexión, elegir modelo, guardar, volver a entrar y ver la lista completa, sin recargas ni pantalla en blanco. 98 pruebas, lint, tipos y build en verde.

**Sin verificar**
- Que esa fuera la única causa: no pude reproducir la pantalla en blanco tal como la viste, la deduje del registro del servidor (una recarga forzada a las 15:31).

## 2026-10-13 · Web, entregas 4, 5 y 6: registros, progreso, ajustes e IA

**Hecho**
- **Registros** (entrega 4): hub con las cuatro secciones, anillos semanales por día (cumplido, parcial, excedido), racha y detalle del día elegido. Comida con alta manual, edición y borrado, e insignias "IA" y "Licor"; agua (+250/+500/+750 ml), ejercicio (+10/+20/+30 min) y sueño (±15 min), con deshacer. **Registro rápido** y **Peso** (±0,1 kg, IMC, meta, gráfica, nota y confirmación).
- **Progreso** (entrega 5): calorías y proteína con la línea de la meta, peso, promedios de agua y sueño, ejercicio, licor, azúcar y grasa, por semana, mes o año.
- **Recordatorios**: los cinco del diseño más recordatorios propios, con notificaciones del navegador y avisos inteligentes (no avisa si ya se cumplió). **Configuración** completa: perfil, metas, IA, recordatorios y cierre de sesión.
- **IA** (entrega 6): Proveedor de IA (Anthropic, OpenAI o Google; probar conexión; modelos cargados del proveedor), cámara o galería, resultado editable del análisis y asistente nutriólogo con sugerencias que se registran con un toque. Ver [ADR 0005](../tecnica/decisiones/0005-ia-desde-el-navegador.md).
- Inicio usa ya los registros reales del usuario.
- Base de datos: tablas `comidas`, `aguas`, `ejercicios`, `suenos` y `pesos` con RLS y permisos por columna, y la función `resumen_diario` para las gráficas (un año de registros no cabe en una respuesta de la API).
- Seed local con dos semanas de registros y doce de peso para `prueba@kalo.test`.
- Dependencias nuevas: `@anthropic-ai/sdk` y `zod`. CSP ampliada a los tres proveedores de IA.

**Verificado (contra Supabase local)**
- Lint, tipos, 98 pruebas y build en verde.
- En el navegador a 390 px con `prueba@kalo.test`: Registros (comida, agua y sueño, con escritura real), Peso, Progreso, Configuración, Asistente, Proveedor de IA y Cámara.
- Vista previa de producción (nginx, CSP completa): Inicio, Registros, Progreso, Asistente y Peso sin infracciones de CSP.
- Por API con las dos cuentas: nadie lee, edita ni borra registros ajenos; no se puede escribir a nombre de otro usuario ni cambiar el origen de una comida; valores fuera de rango rechazados; la función de resumen respeta RLS y no es accesible sin sesión.
- La API key queda cifrada con una clave no extraíble y no aparece en `localStorage`.

**Sin verificar**
- **Ninguna llamada real a un proveedor de IA**: no hay claves en el entorno de desarrollo. El análisis de fotos, el asistente y la prueba de conexión se probaron solo con un proveedor simulado. Los clientes de OpenAI y Google se escribieron contra su API REST sin poder ejecutarlos.
- La cámara real (permiso, captura) y la entrega de una notificación a su hora.
- La vista de escritorio de las pantallas nuevas, más allá de que compila y carga.
- El despliegue real en Vercel y Supabase.

**Diferencias deliberadas respecto al diseño**
- Sueño: no hay hora de dormir, de despertar ni calidad (el diseño las muestra, pero no hay dónde introducirlas); la tarjeta muestra la duración y la meta.
- Agua: la nota no anuncia la hora del próximo aviso.
- Análisis: sin el botón "+ Añadir" ingrediente; los porcentajes de azúcar y grasa son frente a una referencia diaria general (50 g y 65 g), no una meta del usuario.
- Recordatorios: se añade el aviso de permiso del navegador y el formulario de recordatorio propio.
- Proveedor de IA: los modelos se listan con el nombre que da el proveedor, sin las descripciones de ejemplo; la nota dice "en este navegador", no "en tu teléfono".

**Límites conocidos**
- Los recordatorios solo avisan mientras Kalo está abierto en una pestaña: sin servidor de notificaciones no pueden llegar con la web cerrada.
- La conversación con el asistente se pierde al cerrar la pestaña.
- Editar una comida no permite cambiarla de día.
- El paquete principal pesa unos 228 kB comprimido; se puede partir por rutas en la entrega 7.

**Pendiente / siguiente**
- Probar la IA con una clave real de cada proveedor y la cámara en un teléfono.
- Entrega 7: accesibilidad, rendimiento y pruebas de extremo a extremo.
- App móvil.

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
