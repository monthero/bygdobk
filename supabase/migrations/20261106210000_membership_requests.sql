create type public.membership_status as enum ('requested', 'active', 'declined');

alter table public.memberships add column status public.membership_status not null default 'active';

create unique index memberships_open_request_idx
  on public.memberships (profile_id, plan_id, lower(coalesce(player_name, '')), end_date)
  where status = 'requested';

grant insert (status), update (status) on table public.memberships to authenticated;

create policy "Users request memberships for themselves"
  on public.memberships for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and status = 'requested'
    and paid_at is null
    and payment_method is null
    and note is null
  );

create policy "Users cancel their requests"
  on public.memberships for delete
  to authenticated
  using (profile_id = (select auth.uid()) and status = 'requested');

create function private.limit_open_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_open_requests constant int := 5;
begin
  if (select count(*) from public.memberships
      where profile_id = new.profile_id and status = 'requested') >= max_open_requests then
    raise exception 'Too many open membership requests' using errcode = 'PT429';
  end if;
  return new;
end;
$$;

revoke all on function private.limit_open_requests() from public, anon, authenticated;

create trigger limit_open_requests
  before insert on public.memberships
  for each row
  when (new.status = 'requested')
  execute function private.limit_open_requests();
