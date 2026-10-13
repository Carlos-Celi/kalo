-- Registros diarios: comida, agua, ejercicio, sueño y peso.
--
-- Regla común: cada fila pertenece a un usuario (`usuario_id`, que toma por
-- defecto al usuario con sesión), RLS limita todo a las filas propias, el rol
-- anónimo no tiene ningún permiso y `authenticated` solo los que usa la app.
-- `fecha` es el día del calendario local del usuario, no el instante UTC.

create table public.comidas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  tipo text not null check (tipo in ('desayuno', 'almuerzo', 'cena', 'snack', 'licor')),
  nombre text not null check (char_length(nombre) between 1 and 80),
  porcion text not null default '' check (char_length(porcion) <= 40),
  kcal smallint not null check (kcal between 0 and 5000),
  proteina_g numeric(4, 1) not null default 0 check (proteina_g between 0 and 999),
  carbohidratos_g numeric(4, 1) not null default 0 check (carbohidratos_g between 0 and 999),
  azucar_g numeric(4, 1) not null default 0 check (azucar_g between 0 and 999),
  grasa_g numeric(4, 1) not null default 0 check (grasa_g between 0 and 999),
  es_alcohol boolean not null default false,
  grados_alcohol numeric(4, 1) check (grados_alcohol between 0 and 100),
  origen text not null default 'manual' check (origen in ('manual', 'ia')),
  creado_en timestamptz not null default now()
);

create table public.aguas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  ml smallint not null check (ml between 1 and 3000),
  creado_en timestamptz not null default now()
);

create table public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  minutos smallint not null check (minutos between 1 and 600),
  nombre text not null default 'Ejercicio' check (char_length(nombre) between 1 and 80),
  kcal smallint not null default 0 check (kcal between 0 and 5000),
  creado_en timestamptz not null default now()
);

-- Una fila por noche: `fecha` es el día en que se despierta.
create table public.suenos (
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  minutos smallint not null check (minutos between 0 and 840),
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, fecha)
);

-- Un peso por día.
create table public.pesos (
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  kg numeric(4, 1) not null check (kg between 30 and 200),
  nota text not null default '' check (char_length(nota) <= 120),
  actualizado_en timestamptz not null default now(),
  primary key (usuario_id, fecha)
);

create index comidas_usuario_fecha on public.comidas (usuario_id, fecha);
create index aguas_usuario_fecha on public.aguas (usuario_id, fecha);
create index ejercicios_usuario_fecha on public.ejercicios (usuario_id, fecha);

alter table public.comidas enable row level security;
alter table public.aguas enable row level security;
alter table public.ejercicios enable row level security;
alter table public.suenos enable row level security;
alter table public.pesos enable row level security;

revoke all on table public.comidas, public.aguas, public.ejercicios, public.suenos, public.pesos
  from anon, authenticated;

-- `id`, `usuario_id` y las marcas de tiempo no se escriben desde la API: los pone la base de datos.
grant select, delete on table public.comidas to authenticated;
grant insert (fecha, tipo, nombre, porcion, kcal, proteina_g, carbohidratos_g, azucar_g, grasa_g,
  es_alcohol, grados_alcohol, origen) on table public.comidas to authenticated;
grant update (fecha, tipo, nombre, porcion, kcal, proteina_g, carbohidratos_g, azucar_g, grasa_g,
  es_alcohol, grados_alcohol) on table public.comidas to authenticated;

grant select, delete on table public.aguas to authenticated;
grant insert (fecha, ml) on table public.aguas to authenticated;

grant select, delete on table public.ejercicios to authenticated;
grant insert (fecha, minutos, nombre, kcal) on table public.ejercicios to authenticated;

grant select on table public.suenos to authenticated;
grant insert (fecha, minutos) on table public.suenos to authenticated;
grant update (minutos) on table public.suenos to authenticated;

grant select on table public.pesos to authenticated;
grant insert (fecha, kg, nota) on table public.pesos to authenticated;
grant update (kg, nota) on table public.pesos to authenticated;

create policy "Cada usuario lee sus comidas" on public.comidas for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Cada usuario añade sus comidas" on public.comidas for insert
  to authenticated with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario edita sus comidas" on public.comidas for update
  to authenticated using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario borra sus comidas" on public.comidas for delete
  to authenticated using ((select auth.uid()) = usuario_id);

create policy "Cada usuario lee su agua" on public.aguas for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Cada usuario añade su agua" on public.aguas for insert
  to authenticated with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario borra su agua" on public.aguas for delete
  to authenticated using ((select auth.uid()) = usuario_id);

create policy "Cada usuario lee su ejercicio" on public.ejercicios for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Cada usuario añade su ejercicio" on public.ejercicios for insert
  to authenticated with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario borra su ejercicio" on public.ejercicios for delete
  to authenticated using ((select auth.uid()) = usuario_id);

create policy "Cada usuario lee su sueño" on public.suenos for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Cada usuario añade su sueño" on public.suenos for insert
  to authenticated with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario edita su sueño" on public.suenos for update
  to authenticated using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create policy "Cada usuario lee su peso" on public.pesos for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Cada usuario añade su peso" on public.pesos for insert
  to authenticated with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario edita su peso" on public.pesos for update
  to authenticated using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

create trigger suenos_marcar_actualizacion
  before update on public.suenos
  for each row execute function public.marcar_actualizacion();

create trigger pesos_marcar_actualizacion
  before update on public.pesos
  for each row execute function public.marcar_actualizacion();
