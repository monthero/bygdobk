create table public.shift_volunteers (
  id uuid primary key default gen_random_uuid(),
  event_id text not null check (char_length(event_id) between 1 and 200),
  shift_key text not null check (char_length(shift_key) between 1 and 200),
  profile_id uuid references public.profiles (id) on delete cascade,
  volunteer_name text check (char_length(trim(volunteer_name)) between 1 and 100),
  note text check (char_length(note) <= 500),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  check (profile_id is not null or volunteer_name is not null)
);

create unique index shift_volunteers_own_idx
  on public.shift_volunteers (event_id, shift_key, profile_id)
  where volunteer_name is null;

create index shift_volunteers_event_id_idx on public.shift_volunteers (event_id);

alter table public.shift_volunteers enable row level security;

-- Column grants keep created_by and created_at honest, even for admins.
revoke all on table public.shift_volunteers from anon, authenticated;
grant select, delete on table public.shift_volunteers to authenticated;
grant insert (event_id, shift_key, profile_id, volunteer_name, note),
  update (volunteer_name, note)
  on table public.shift_volunteers to authenticated;

create policy "Users read their shifts, admins read all"
  on public.shift_volunteers for select
  to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_admin()));

create policy "Users take shifts for themselves, admins add anyone"
  on public.shift_volunteers for insert
  to authenticated
  with check (
    (profile_id = (select auth.uid()) and volunteer_name is null)
    or (select private.is_admin())
  );

create policy "Admins update shift volunteers"
  on public.shift_volunteers for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Users drop their shifts, admins remove anyone"
  on public.shift_volunteers for delete
  to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_admin()));

create function public.shift_counts(p_event_id text)
returns table (shift_key text, taken int)
language sql
stable
security definer
set search_path = ''
as $$
  select v.shift_key, count(*)::int
  from public.shift_volunteers v
  where v.event_id = p_event_id
  group by v.shift_key;
$$;

revoke all on function public.shift_counts(text) from public;
grant execute on function public.shift_counts(text) to anon, authenticated;
