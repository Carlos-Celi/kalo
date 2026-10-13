-- Recordatorios en la nube y avisos por correo.
--
-- Hasta ahora los recordatorios vivían solo en el navegador. Para poder
-- enviarlos por correo aunque Kalo esté cerrado, el servidor tiene que
-- conocerlos: se guardan aquí, por usuario, con RLS. El envío lo hace la
-- función `enviar-recordatorios` (supabase/functions), que usa la clave de
-- servicio y por eso es la única que toca `avisos_enviados`.

alter table public.perfiles
  add column avisos_correo boolean not null default false,
  -- Nombre IANA ("America/Bogota"): el servidor decide qué hora es para cada persona.
  add column zona_horaria text not null default 'UTC'
    check (char_length(zona_horaria) between 1 and 64);

grant update (avisos_correo, zona_horaria) on table public.perfiles to authenticated;

create table public.recordatorios (
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- El id lo decide el cliente ("agua", "propio-1760000000000").
  id text not null check (char_length(id) between 1 and 40),
  tipo text not null check (tipo in ('agua', 'comidas', 'ejercicio', 'dormir', 'peso', 'propio')),
  nombre text not null check (char_length(nombre) between 1 and 40),
  -- "08:00", "13:30"… en formato 24 h.
  horas text[] not null check (
    cardinality(horas) between 1 and 24
    and array_to_string(horas, ',') ~ '^(([01][0-9]|2[0-3]):[0-5][0-9])(,([01][0-9]|2[0-3]):[0-5][0-9])*$'
  ),
  -- 0 = domingo … 6 = sábado.
  dias smallint[] not null check (dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  activo boolean not null default true,
  orden smallint not null default 0,
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, id)
);

alter table public.recordatorios enable row level security;

revoke all on table public.recordatorios from anon, authenticated;
grant select, delete on table public.recordatorios to authenticated;
grant insert (id, tipo, nombre, horas, dias, activo, orden) on table public.recordatorios to authenticated;
-- `id` va en la lista porque el upsert de la API lo reescribe; RLS impide tocar filas ajenas.
grant update (id, tipo, nombre, horas, dias, activo, orden) on table public.recordatorios to authenticated;

create policy "Cada usuario lee sus recordatorios" on public.recordatorios for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Cada usuario añade sus recordatorios" on public.recordatorios for insert
  to authenticated with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario edita sus recordatorios" on public.recordatorios for update
  to authenticated using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario borra sus recordatorios" on public.recordatorios for delete
  to authenticated using ((select auth.uid()) = usuario_id);

create trigger recordatorios_marcar_actualizacion
  before update on public.recordatorios
  for each row execute function public.marcar_actualizacion();

-- Qué avisos ya se enviaron por correo, para no repetirlos entre ejecuciones.
-- Sin políticas ni permisos: solo la clave de servicio (que ignora RLS) accede.
create table public.avisos_enviados (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  -- "2026-10-14|agua|08:00"
  clave text not null check (char_length(clave) between 1 and 80),
  enviado_en timestamptz not null default now(),
  primary key (usuario_id, clave)
);

alter table public.avisos_enviados enable row level security;
revoke all on table public.avisos_enviados from anon, authenticated;

create index avisos_enviados_enviado_en on public.avisos_enviados (enviado_en);
