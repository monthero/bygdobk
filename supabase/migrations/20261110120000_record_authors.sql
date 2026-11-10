alter table public.memberships
  add column updated_at timestamptz,
  add column updated_by uuid references public.profiles (id) on delete set null,
  add column paid_by uuid references public.profiles (id) on delete set null,
  add column decided_at timestamptz,
  add column decided_by uuid references public.profiles (id) on delete set null;

create index memberships_updated_by_idx on public.memberships (updated_by);
create index memberships_paid_by_idx on public.memberships (paid_by);
create index memberships_decided_by_idx on public.memberships (decided_by);

update public.shift_volunteers v
set created_by = null
where created_by is not null and not exists (select 1 from public.profiles p where p.id = v.created_by);

alter table public.shift_volunteers
  add constraint shift_volunteers_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;

create index shift_volunteers_created_by_idx on public.shift_volunteers (created_by);

alter table public.profiles
  add column admin_since timestamptz,
  add column admin_granted_by uuid references public.profiles (id) on delete set null;

create index profiles_admin_granted_by_idx on public.profiles (admin_granted_by);

create function private.stamp_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.updated_at := now();
    new.updated_by := auth.uid();
    new.paid_by := case when new.paid_at is not null then auth.uid() end;
    new.decided_at := null;
    new.decided_by := null;
    return new;
  end if;
  if (new.profile_id, new.player_name, new.plan_id, new.start_date, new.end_date, new.price_nok,
      new.paid_at, new.payment_method, new.note, new.status)
    is distinct from (old.profile_id, old.player_name, old.plan_id, old.start_date, old.end_date, old.price_nok,
      old.paid_at, old.payment_method, old.note, old.status) then
    new.updated_at := now();
    new.updated_by := auth.uid();
  end if;
  if new.paid_at is null then
    new.paid_by := null;
  elsif old.paid_at is null then
    new.paid_by := auth.uid();
  end if;
  if new.status is distinct from old.status then
    if new.status = 'requested' then
      new.decided_at := null;
      new.decided_by := null;
    else
      new.decided_at := now();
      new.decided_by := auth.uid();
    end if;
  end if;
  return new;
end;
$$;

create function private.stamp_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.is_admin = old.is_admin then
    return new;
  end if;
  if new.is_admin then
    new.admin_since := now();
    new.admin_granted_by := auth.uid();
  else
    new.admin_since := null;
    new.admin_granted_by := null;
  end if;
  return new;
end;
$$;

revoke all on function private.stamp_membership() from public, anon, authenticated;
revoke all on function private.stamp_admin() from public, anon, authenticated;

create trigger stamp_membership
  before insert or update on public.memberships
  for each row execute function private.stamp_membership();

create trigger stamp_admin
  before insert or update of is_admin on public.profiles
  for each row execute function private.stamp_admin();

drop function public.board_admins();

create function public.board_admins()
returns table (id uuid, name text, email text, avatar_url text, admin_since timestamptz, granted_by_name text, granted_by_is_admin boolean)
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
    select p.id, p.name, p.email, p.avatar_url, p.admin_since, g.name, g.is_admin
    from public.profiles p
    left join public.profiles g on g.id = p.admin_granted_by
    where p.is_admin
    order by lower(p.name), p.email;
end;
$$;

revoke all on function public.board_admins() from public, anon;
grant execute on function public.board_admins() to authenticated;
