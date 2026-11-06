alter table public.profiles
  add column locale text check (locale in ('nb', 'en', 'sv', 'fi', 'zh')),
  add column color_scheme text check (color_scheme in ('light', 'dark', 'auto')),
  add column avatar_url text check (avatar_url ~ '^https://');

grant update (locale, color_scheme) on table public.profiles to authenticated;

create function private.avatar_url(meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(trim(coalesce(meta ->> 'avatar_url', meta ->> 'picture')), '')
  where coalesce(meta ->> 'avatar_url', meta ->> 'picture') like 'https://%';
$$;

revoke all on function private.avatar_url(jsonb) from public;

create or replace function private.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    private.display_name(new.raw_user_meta_data, new.email),
    private.avatar_url(new.raw_user_meta_data)
  );
  return new;
end;
$$;

update public.profiles p
set avatar_url = private.avatar_url(u.raw_user_meta_data)
from auth.users u
where u.id = p.id and p.avatar_url is null;
