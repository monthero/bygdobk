insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public URLs skip RLS, so reads stay open while listing is limited to your own folder.
create policy "Users list their own avatars"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload their own avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users update their own avatars"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant update (avatar_url) on table public.profiles to authenticated;

create function private.is_own_avatar(url text, user_id uuid)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select url ~ ('^https://zlxdoolpodirahjjsoqy\.supabase\.co/storage/v1/object/public/avatars/'
    || user_id::text || '/[A-Za-z0-9_-]+\.(webp|jpe?g)$');
$$;

create function private.check_avatar_url()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.avatar_url is null
    or private.is_own_avatar(new.avatar_url, new.id)
    or new.avatar_url = (select private.avatar_url(u.raw_user_meta_data) from auth.users u where u.id = new.id)
  then
    return new;
  end if;
  raise exception 'avatar_url must be your own upload or your Google picture' using errcode = 'check_violation';
end;
$$;

revoke all on function private.is_own_avatar(text, uuid) from public;
revoke all on function private.check_avatar_url() from public, anon, authenticated;

create trigger check_avatar_url
  before update of avatar_url on public.profiles
  for each row
  when (old.avatar_url is distinct from new.avatar_url)
  execute function private.check_avatar_url();

-- An upload falls back to the Google picture; the Google picture itself goes away.
create function public.remove_avatar()
returns text
language sql
security definer
set search_path = ''
as $$
  update public.profiles p
  set avatar_url = case
    when private.is_own_avatar(p.avatar_url, p.id) then private.avatar_url(u.raw_user_meta_data)
  end
  from auth.users u
  where p.id = (select auth.uid()) and u.id = p.id
  returning p.avatar_url;
$$;

revoke all on function public.remove_avatar() from public, anon;
grant execute on function public.remove_avatar() to authenticated;
