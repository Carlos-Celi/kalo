# Recordatorios por correo

Además de las notificaciones del navegador (que solo llegan con Kalo abierto), los recordatorios pueden enviarse al correo de la cuenta. Es opcional y se activa en **Recordatorios → Por correo**. Decisión y motivos: [ADR 0006](decisiones/0006-recordatorios-por-correo.md).

## Cómo funciona

```
pg_cron (cada 5 min) ──POST x-cron-secret──▶ Edge Function enviar-recordatorios
                                               │ lee perfiles con avisos_correo = true
                                               │ calcula la hora local de cada persona
                                               │ aplica los avisos inteligentes
                                               ▼
                                             Resend ──▶ correo
```

- La web guarda los recordatorios en `public.recordatorios` (con RLS) además de en el dispositivo, y la preferencia (`perfiles.avisos_correo` y la zona horaria) en `perfiles`.
- La función `supabase/functions/enviar-recordatorios` usa la clave de servicio, así que ignora RLS: por eso solo la llama la tarea programada, que se identifica con un secreto compartido.
- Cada aviso se envía una vez: queda anotado en `public.avisos_enviados` (sin permisos para la API).
- Se manda **un correo por persona y pasada**, con todos los avisos que tocan en ese momento.
- Mismas reglas que el navegador: no avisa del agua si ya se llegó a la meta, del ejercicio si ya se hizo, ni de una comida ya registrada.

## Puesta en marcha

Hace falta una cuenta en [Resend](https://resend.com) (plan gratuito: unos 3.000 correos al mes).

1. **Remitente.** Con el remitente de pruebas `onboarding@resend.dev` Resend solo entrega al correo de tu propia cuenta de Resend. Para enviar a otras personas hay que verificar un dominio en Resend (registros DNS) y usar una dirección de ese dominio.
2. **Esquema.** Aplica las migraciones (`supabase db push`): crean `recordatorios`, `avisos_enviados` y las columnas `avisos_correo` y `zona_horaria` de `perfiles`.
3. **Secretos de la función.** Se guardan en Supabase, nunca en git ni en variables `VITE_*`:

   ```bash
   supabase secrets set CRON_SECRET="<una cadena larga y aleatoria>" \
     RESEND_API_KEY="<tu API key de Resend>" \
     CORREO_REMITENTE="Kalo <avisos@tu-dominio.com>" \
     URL_APP="https://<tu-app>.vercel.app"
   ```

4. **Desplegar la función.** `supabase/config.toml` ya la declara sin verificación de JWT (se autentica con su propio secreto):

   ```bash
   supabase functions deploy enviar-recordatorios
   ```

5. **Programarla.** En el editor SQL de Supabase (activa antes las extensiones `pg_cron` y `pg_net` en *Database → Extensions*). El secreto va en el Vault, no escrito en la consulta:

   ```sql
   select vault.create_secret('<el mismo valor de CRON_SECRET>', 'kalo_cron_secret');

   select cron.schedule(
     'kalo-enviar-recordatorios',
     '*/5 * * * *',
     $$
     select net.http_post(
       url := 'https://<ref-del-proyecto>.supabase.co/functions/v1/enviar-recordatorios',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'kalo_cron_secret')
       ),
       body := '{}'::jsonb
     );
     $$
   );
   ```

6. **Probarla a mano** (devuelve cuántas personas revisó y cuántos correos envió):

   ```bash
   curl -X POST "https://<ref-del-proyecto>.supabase.co/functions/v1/enviar-recordatorios" \
     -H "x-cron-secret: <CRON_SECRET>"
   ```

## Comprobaciones

- Lógica de avisos (zonas horarias, ventana, avisos inteligentes, correo): `node --test supabase/functions/_shared/avisos.test.ts` (Node 24, sin dependencias).
- La función en sí (consulta a Supabase y envío con Resend) **no se ha probado contra servicios reales**: requiere el proyecto de Supabase y una cuenta de Resend.

## Privacidad

- El correo solo lleva el título y el texto del aviso y un enlace a la app; nunca cifras de salud.
- La dirección sale de `auth.users` dentro de la función y no se guarda en otro sitio.
- Desactivar el interruptor deja de enviar de inmediato (la función filtra por `avisos_correo`).
