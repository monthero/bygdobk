create table public.shuttlekaos_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  address text check (char_length(address) <= 160),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.shuttlekaos_locations enable row level security;

create policy "Everyone reads active locations"
  on public.shuttlekaos_locations for select
  to anon, authenticated
  using (is_active);

grant select on public.shuttlekaos_locations to anon, authenticated;

insert into public.shuttlekaos_locations (name, address, lat, lng, sort_order) values
  ('Bygdøhus', 'Huk Aveny 45, 0287 Oslo', 59.90262, 10.68189, 0);

create or replace function public.public_shuttlekaos_sessions(p_levels text[])
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with listed as (
    select s.*, o.name as organizer_name
    from public.shuttlekaos_sessions s
    join public.profiles o on o.id = s.owner_id
    where s.is_public
      and private.shuttlekaos_is_active(s.status, s.updated_at)
      and (coalesce(cardinality(p_levels), 0) = 0 or cardinality(s.levels) = 0 or s.levels && p_levels)
    order by s.status = 'open' desc, s.created_at desc, s.id
    limit 50
  )
  select coalesce(json_agg(json_build_object(
    'id', l.id,
    'shareCode', l.share_code,
    'title', l.title,
    'status', l.status,
    'isPublic', l.is_public,
    'levels', l.levels,
    'format', l.data -> 'settings' ->> 'format',
    'style', l.data -> 'settings' ->> 'style',
    'organizerId', l.owner_id,
    'organizerName', l.organizer_name,
    'playerCount', jsonb_array_length(l.data -> 'players'),
    'createdAt', private.shuttlekaos_iso(l.created_at),
    'startedAt', private.shuttlekaos_iso(l.started_at),
    'finishedAt', private.shuttlekaos_iso(l.finished_at),
    'location', l.data -> 'location'
  ) order by l.status = 'open' desc, l.created_at desc, l.id), '[]'::json)
  from listed l;
$$;
