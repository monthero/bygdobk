create or replace function private.check_avatar_url()
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
  raise exception 'avatar_url must be your own upload or your login picture' using errcode = 'check_violation';
end;
$$;

-- Facebook picture links expire, so follow the login picture unless the user uploaded or removed one.
create function private.refresh_login_avatar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set avatar_url = private.avatar_url(new.raw_user_meta_data)
  where id = new.id
    and avatar_url = private.avatar_url(old.raw_user_meta_data)
    and avatar_url is distinct from private.avatar_url(new.raw_user_meta_data);
  return new;
end;
$$;

revoke all on function private.refresh_login_avatar() from public, anon, authenticated;

create trigger on_auth_user_metadata_changed
  after update of raw_user_meta_data on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function private.refresh_login_avatar();
