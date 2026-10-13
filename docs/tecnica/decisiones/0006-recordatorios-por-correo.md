# 0006 · Recordatorios por correo con una Edge Function programada

- Fecha: 2026-10-14
- Estado: aceptada (sin verificar contra servicios reales)

## Contexto
Los recordatorios eran avisos locales: se guardaban en `localStorage` y el navegador los notificaba mientras Kalo estaba abierto. Se pidió que también pudieran llegar al correo. Un correo sale de un servidor y a una hora aunque la web esté cerrada, así que el servidor tiene que conocer los recordatorios y tener una forma de enviar.

## Decisión
- **Los recordatorios pasan a Supabase** (`public.recordatorios`, con RLS) sin dejar de guardarse en el dispositivo. Lo local sigue mandando para que la pantalla no espere a la red; con cuenta, cada cambio se copia a la nube y al abrir Kalo se alinea el dispositivo con el servidor.
- **El canal de correo es una preferencia de la cuenta** (`perfiles.avisos_correo`), junto con la **zona horaria** del dispositivo, para que el servidor sepa qué hora es para cada persona. Se refresca al abrir Kalo.
- **Una Edge Function** (`supabase/functions/enviar-recordatorios`) decide y envía; **pg_cron** la invoca cada 5 minutos con un secreto compartido. Los avisos enviados se anotan en `avisos_enviados` para no repetirlos.
- **Resend** como proveedor de correo, por su API REST simple y su plan gratuito. Es un detalle de la función: cambiar de proveedor no toca la web.
- **Las mismas reglas que el navegador** (ventana de 10 minutos, avisos inteligentes). La lógica pura vive en `supabase/functions/_shared/avisos.ts` y tiene sus pruebas con Node.

## Consecuencias
- El proyecto necesita secretos del lado servidor (`CRON_SECRET`, `RESEND_API_KEY`, `CORREO_REMITENTE`, `URL_APP`), guardados en Supabase y nunca en git ni en `VITE_*`. Guía en [recordatorios-por-correo.md](../recordatorios-por-correo.md).
- Las reglas de avisos existen dos veces (web y función) porque la función se despliega aparte y no puede importar de `web/`. Si cambian, hay que cambiarlas en los dos sitios.
- La función usa la clave de servicio: ignora RLS. Por eso `verify_jwt` está desactivado y se protege con su propio secreto, comparado en tiempo constante, y solo lee lo necesario.
- Con el remitente de pruebas de Resend solo se entrega al correo del propietario de la cuenta de Resend; para el resto hay que verificar un dominio.
- Sin cuenta (modo demostración) el canal de correo no está disponible y la pantalla lo dice.
