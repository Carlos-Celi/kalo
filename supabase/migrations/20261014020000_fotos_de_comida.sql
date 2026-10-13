-- Foto ultracomprimida de la comida, y alcohol solo en snacks y licores.
--
-- La foto no se guarda como archivo: la app la reduce a una miniatura WebP
-- (unas decenas de KB) y la guarda como texto en la propia fila. Así hereda
-- las reglas de acceso de `comidas` (RLS) sin un bucket aparte. Las listas
-- piden `tiene_foto`, nunca `foto`, para no descargar imágenes en cada carga.

alter table public.comidas
  add column foto text check (
    foto is null or (
      char_length(foto) <= 100000
      and foto ~ '^data:image/(webp|jpeg);base64,[A-Za-z0-9+/=]+$'
    )
  ),
  add column tiene_foto boolean generated always as (foto is not null) stored;

grant insert (foto) on table public.comidas to authenticated;
-- Permite quitar la foto de una comida sin borrarla.
grant update (foto) on table public.comidas to authenticated;

-- La marca de alcohol solo tiene sentido en snacks y licores. `not valid`: no
-- revisa las filas anteriores, pero sí toda inserción y edición nueva.
alter table public.comidas
  add constraint comidas_alcohol_solo_snack_y_licor
  check (not es_alcohol or tipo in ('snack', 'licor')) not valid;
