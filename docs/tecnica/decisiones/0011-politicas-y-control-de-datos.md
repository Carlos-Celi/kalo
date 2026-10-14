# 0011 · Políticas legales y control de los datos por la persona

- Fecha: 2026-10-13
- Estado: aceptada (web); `mobile/` pendiente

## Contexto
Kalo guarda datos de salud (comidas, peso, sueño y condiciones como diabetes o hipertensión). La app no tenía política de privacidad, términos ni política de cookies, no pedía consentimiento explícito al registrarse y no ofrecía descargar ni borrar los datos. Las tiendas de apps exigen poder borrar la cuenta desde la propia app y la normativa de protección de datos exige consentimiento explícito para datos de salud y derechos de acceso, portabilidad y supresión.

## Decisión
- **Documentos públicos** en `/privacidad`, `/terminos` y `/cookies`, escritos a partir de lo que la app hace de verdad (qué se guarda, dónde, con qué terceros y cuánto tiempo). No nombran a una persona ni un correo concretos: el contacto es opcional (`VITE_CONTACTO_PRIVACIDAD`) y, sin él, la política remite a Configuración, donde los derechos se ejercen sin intermediarios.
- **Consentimiento explícito** al crear la cuenta, con una casilla obligatoria que cubre términos, privacidad y el tratamiento de datos de salud. La versión aceptada (`VERSION_POLITICAS`) y la fecha se guardan en los metadatos de la cuenta de Supabase.
- **Sin cookies ni banner**: la app no usa cookies, analítica ni publicidad. El almacenamiento local que usa es estrictamente necesario, así que basta con informarlo en `/cookies`.
- **Descargar mis datos** desde Configuración: un JSON con perfil, plan, registros, pesos y recordatorios. Sin fotos (para que el archivo sea ligero) y sin la API key, que nunca sale del dispositivo.
- **Eliminar mi cuenta** desde Configuración, con confirmación escrita. La función `public.eliminar_mi_cuenta()` (`security definer`, `search_path` vacío, solo para `authenticated`) borra la fila de `auth.users` del que llama; las claves foráneas `on delete cascade` arrastran perfil, registros, fotos, recordatorios y sesiones. Después la web borra lo que guardó en el dispositivo y cierra la sesión.
- **Contraseñas** con letras y números además del mínimo de 8 caracteres, en Supabase y en la validación del cliente.
- **Errores** con un único componente (`Alerta`) que dice qué pasó y qué hacer.

## Consecuencias
- Hay que aplicar la migración `20261015000000_eliminar_cuenta.sql` en producción (`supabase db push`) y fijar *Password requirements* en el panel de Supabase.
- Si cambian los documentos de forma importante, se sube `VERSION_POLITICAS` y se avisa en la app.
- Las copias de seguridad del proveedor de base de datos pueden conservar datos borrados durante su ciclo de retención; la política lo dice.
- `mobile/` debe ofrecer lo mismo (consentimiento, descargar y eliminar la cuenta) cuando se construya.
