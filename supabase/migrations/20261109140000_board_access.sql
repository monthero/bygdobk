create function public.board_admins()
returns table (id uuid, name text, email text, avatar_url text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only admins can see board access' using errcode = '42501';
  end if;
  return query
    select p.id, p.name, p.email, p.avatar_url
    from public.profiles p
    where p.is_admin
    order by lower(p.name), p.email;
end;
$$;

create function public.grant_admin(p_email text)
returns table (id uuid, name text, email text, avatar_url text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not private.is_admin() then
    raise exception 'Only admins can change board access' using errcode = '42501';
  end if;
  select p.id into target from public.profiles p where lower(p.email) = lower(trim(p_email));
  if target is null then
    raise exception 'No account with this email' using errcode = 'BA001',
      hint = 'They need to log in once before they can be made an admin.';
  end if;
  update public.profiles p set is_admin = true where p.id = target and not p.is_admin;
  return query
    select p.id, p.name, p.email, p.avatar_url from public.profiles p where p.id = target;
end;
$$;

create function public.revoke_admin(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Two admins removing each other at the same time must not leave the club without one.
  perform 1 from public.profiles where is_admin order by id for update;
  if not private.is_admin() then
    raise exception 'Only admins can change board access' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile_id and is_admin) then
    return;
  end if;
  if not exists (select 1 from public.profiles where is_admin and id <> p_profile_id) then
    raise exception 'Can''t remove the last admin' using errcode = 'BA003';
  end if;
  if p_profile_id = (select auth.uid()) then
    raise exception 'Admins can''t remove themselves' using errcode = 'BA002';
  end if;
  update public.profiles set is_admin = false where id = p_profile_id;
end;
$$;

revoke all on function public.board_admins() from public, anon;
revoke all on function public.grant_admin(text) from public, anon;
revoke all on function public.revoke_admin(uuid) from public, anon;
grant execute on function public.board_admins() to authenticated;
grant execute on function public.grant_admin(text) to authenticated;
grant execute on function public.revoke_admin(uuid) to authenticated;
