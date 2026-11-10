drop function public.board_admins();

create function public.board_admins()
returns table (id uuid, name text, email text, avatar_url text, admin_since timestamptz, granted_by_name text, granted_by_email text)
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
    select p.id, p.name, p.email, p.avatar_url, p.admin_since, g.name, g.email
    from public.profiles p
    left join public.profiles g on g.id = p.admin_granted_by
    where p.is_admin
    order by lower(p.name), p.email;
end;
$$;

revoke all on function public.board_admins() from public, anon;
grant execute on function public.board_admins() to authenticated;
