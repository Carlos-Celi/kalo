-- Perfil de cada usuario. Una fila por cuenta, creada automáticamente al registrarse.
-- Regla general del esquema: toda tabla lleva RLS y solo expone al cliente
-- los permisos y columnas que necesita.

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text check (char_length(nombre) between 1 and 60),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.perfiles is 'Datos de perfil del usuario; cada quien solo ve y edita el suyo.';

alter table public.perfiles enable row level security;

-- Permisos mínimos: sin acceso anónimo; el usuario autenticado lee su fila
-- y solo puede modificar `nombre`. Insertar y borrar no se exponen: la fila
-- la crea el disparador y desaparece al eliminarse la cuenta.
revoke all on table public.perfiles from anon, authenticated;
grant select on table public.perfiles to authenticated;
grant update (nombre) on table public.perfiles to authenticated;

create policy "Cada usuario lee su perfil"
  on public.perfiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Cada usuario actualiza su perfil"
  on public.perfiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Mantiene `actualizado_en`.
create function public.marcar_actualizacion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger perfiles_marcar_actualizacion
  before update on public.perfiles
  for each row execute function public.marcar_actualizacion();

-- Crea el perfil al registrarse un usuario. Es `security definer` porque se
-- ejecuta desde auth; por eso fija `search_path` y no es invocable desde la API.
create function public.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.crear_perfil_de_usuario() from public, anon, authenticated;
revoke execute on function public.marcar_actualizacion() from public, anon, authenticated;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_de_usuario();
