create schema if not exists private;
grant usage on schema private to authenticated;

create type public.app_role as enum ('admin', 'member');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null check (char_length(trim(name)) between 1 and 100),
  role public.app_role not null default 'member',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Column grants keep the role read-only for users; RLS alone can't limit columns.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (name) on table public.profiles to authenticated;

create function private.display_name(meta jsonb, email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(coalesce(
    nullif(trim(meta ->> 'full_name'), ''),
    nullif(trim(meta ->> 'name'), ''),
    nullif(split_part(email, '@', 1), ''),
    'Member'
  ), 100);
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.display_name(jsonb, text) from public;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Admins read all profiles"
  on public.profiles for select
  to authenticated
  using ((select private.is_admin()));

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function private.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), private.display_name(new.raw_user_meta_data, new.email));
  return new;
end;
$$;

create function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

revoke all on function private.create_profile() from public, anon, authenticated;
revoke all on function private.sync_profile_email() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.create_profile();

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

insert into public.profiles (id, email, name)
select id, coalesce(email, ''), private.display_name(raw_user_meta_data, email)
from auth.users
on conflict (id) do nothing;
