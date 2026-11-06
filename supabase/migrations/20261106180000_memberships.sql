alter table public.profiles add column is_admin boolean not null default false;

update public.profiles set is_admin = true where role = 'admin';

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_admin
  );
$$;

alter table public.profiles drop column role;

drop type public.app_role;

create type public.payment_method as enum ('vipps', 'bank_transfer', 'card', 'cash', 'member_site', 'other');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  player_name text check (char_length(trim(player_name)) between 1 and 100),
  plan_id text not null check (char_length(plan_id) between 1 and 100),
  start_date date not null,
  end_date date not null,
  price_nok integer not null check (price_nok >= 0),
  paid_at timestamptz,
  payment_method public.payment_method,
  note text check (char_length(note) <= 1000),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check ((paid_at is null) = (payment_method is null)),
  check (profile_id is not null or player_name is not null)
);

create index memberships_profile_id_idx on public.memberships (profile_id);
create index memberships_dates_idx on public.memberships (start_date, end_date);

alter table public.memberships enable row level security;

-- Column grants keep created_by and created_at honest, even for admins.
revoke all on table public.memberships from anon, authenticated;
grant select, delete on table public.memberships to authenticated;
grant insert (profile_id, player_name, plan_id, start_date, end_date, price_nok, paid_at, payment_method, note),
  update (profile_id, player_name, plan_id, start_date, end_date, price_nok, paid_at, payment_method, note)
  on table public.memberships to authenticated;

create policy "Members read their memberships, admins read all"
  on public.memberships for select
  to authenticated
  using (profile_id = (select auth.uid()) or (select private.is_admin()));

create policy "Admins add memberships"
  on public.memberships for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins update memberships"
  on public.memberships for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins delete memberships"
  on public.memberships for delete
  to authenticated
  using ((select private.is_admin()));

-- A deleted account keeps its own memberships as named rows, so the profile_id check holds.
create function private.name_orphaned_memberships()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.memberships set player_name = old.name
  where profile_id = old.id and player_name is null;
  return old;
end;
$$;

revoke all on function private.name_orphaned_memberships() from public, anon, authenticated;

create trigger name_orphaned_memberships
  before delete on public.profiles
  for each row execute function private.name_orphaned_memberships();
