-- Siestas y calorías de ejercicio puestas a mano.
--
-- Siestas: el sueño de la noche ya vive en `suenos` (una fila por noche). Las
-- siestas se añaden aparte, varias por día, y se suman al total de sueño.
-- Ejercicio: las calorías pueden venir de un reloj o pulsera; `kcal_origen`
-- distingue ese dato de la estimación a partir de los minutos.

create table public.siestas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  minutos smallint not null check (minutos between 1 and 240),
  creado_en timestamptz not null default now()
);

create index siestas_usuario_fecha on public.siestas (usuario_id, fecha);

alter table public.siestas enable row level security;

revoke all on table public.siestas from anon, authenticated;
grant select, delete on table public.siestas to authenticated;
grant insert (fecha, minutos) on table public.siestas to authenticated;

create policy "Cada usuario lee sus siestas" on public.siestas for select
  to authenticated using ((select auth.uid()) = usuario_id);
create policy "Cada usuario añade sus siestas" on public.siestas for insert
  to authenticated with check ((select auth.uid()) = usuario_id);
create policy "Cada usuario borra sus siestas" on public.siestas for delete
  to authenticated using ((select auth.uid()) = usuario_id);

alter table public.ejercicios
  add column kcal_origen text not null default 'estimado'
  check (kcal_origen in ('estimado', 'manual'));

grant insert (kcal_origen) on table public.ejercicios to authenticated;

-- El resumen diario suma las siestas al sueño de la noche.
create or replace function public.resumen_diario(desde date, hasta date)
returns table (
  fecha date,
  kcal integer,
  proteina_g numeric,
  azucar_g numeric,
  grasa_g numeric,
  agua_ml integer,
  ejercicio_min integer,
  ejercicio_kcal integer,
  sueno_min integer,
  bebidas_alcohol integer,
  kcal_alcohol integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with dias as (
    -- Como mucho 400 días por llamada.
    select generate_series(desde, least(hasta, desde + 399), interval '1 day')::date as fecha
  ),
  comida as (
    select
      c.fecha,
      sum(c.kcal) as kcal,
      sum(c.proteina_g) as proteina_g,
      sum(c.azucar_g) as azucar_g,
      sum(c.grasa_g) as grasa_g,
      count(*) filter (where c.es_alcohol) as bebidas_alcohol,
      coalesce(sum(c.kcal) filter (where c.es_alcohol), 0) as kcal_alcohol
    from public.comidas c
    where c.fecha between desde and hasta
    group by c.fecha
  ),
  agua as (
    select a.fecha, sum(a.ml) as ml
    from public.aguas a
    where a.fecha between desde and hasta
    group by a.fecha
  ),
  ejercicio as (
    select e.fecha, sum(e.minutos) as minutos, sum(e.kcal) as kcal
    from public.ejercicios e
    where e.fecha between desde and hasta
    group by e.fecha
  ),
  siesta as (
    select s.fecha, sum(s.minutos) as minutos
    from public.siestas s
    where s.fecha between desde and hasta
    group by s.fecha
  )
  select
    d.fecha,
    coalesce(comida.kcal, 0)::integer,
    coalesce(comida.proteina_g, 0),
    coalesce(comida.azucar_g, 0),
    coalesce(comida.grasa_g, 0),
    coalesce(agua.ml, 0)::integer,
    coalesce(ejercicio.minutos, 0)::integer,
    coalesce(ejercicio.kcal, 0)::integer,
    (coalesce(s.minutos, 0) + coalesce(siesta.minutos, 0))::integer,
    coalesce(comida.bebidas_alcohol, 0)::integer,
    coalesce(comida.kcal_alcohol, 0)::integer
  from dias d
  left join comida on comida.fecha = d.fecha
  left join agua on agua.fecha = d.fecha
  left join ejercicio on ejercicio.fecha = d.fecha
  left join siesta on siesta.fecha = d.fecha
  left join public.suenos s on s.fecha = d.fecha
  order by d.fecha;
$$;
