begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000000ab01', 'record-authors-a@example.invalid', '{"full_name": "Authors Test A"}'),
  ('00000000-0000-4000-8000-00000000ab02', 'record-authors-b@example.invalid', '{"full_name": "Authors Test B"}'),
  ('00000000-0000-4000-8000-00000000ab03', 'record-authors-c@example.invalid', '{"full_name": "Authors Test C"}');

update public.profiles set is_admin = true where id = '00000000-0000-4000-8000-00000000ab01';

do $$
declare
  a record;
begin
  select * into strict a from public.profiles where id = '00000000-0000-4000-8000-00000000ab01';
  if a.admin_since is null or a.admin_granted_by is not null then
    raise exception 'an admin made in SQL should get admin_since and no granter: %', a;
  end if;
end $$;

do $$
declare
  editable constant text[] := array['end_date', 'note', 'paid_at', 'payment_method', 'plan_id', 'player_name',
    'price_nok', 'profile_id', 'start_date', 'status'];
  privilege text;
  granted text[];
begin
  foreach privilege in array array['INSERT', 'UPDATE'] loop
    select array_agg(column_name::text order by column_name) into granted
    from information_schema.column_privileges
    where table_schema = 'public' and table_name = 'memberships'
      and grantee = 'authenticated' and privilege_type = privilege;
    if granted is distinct from editable then
      raise exception 'memberships % grants changed: %', privilege, granted;
    end if;
  end loop;
end $$;

insert into public.memberships (id, profile_id, plan_id, start_date, end_date, price_nok, created_by) values
  ('00000000-0000-4000-8000-0000000a0001', '00000000-0000-4000-8000-00000000ab02', 'adult', '2026-08-01', '2027-06-30', 1000,
    '00000000-0000-4000-8000-00000000ab01');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ab01", "role": "authenticated"}', true);

do $$
begin
  insert into public.memberships (profile_id, plan_id, start_date, end_date, price_nok, updated_by)
  values ('00000000-0000-4000-8000-00000000ab02', 'adult', '2026-08-01', '2027-06-30', 1000, '00000000-0000-4000-8000-00000000ab01');
  raise exception 'an admin could insert updated_by';
exception when insufficient_privilege then null;
end $$;

do $$
declare
  stamp text;
begin
  foreach stamp in array array['updated_at', 'updated_by', 'paid_by', 'decided_at', 'decided_by', 'created_by', 'created_at'] loop
    begin
      execute format('update public.memberships set %I = null where id = %L', stamp, '00000000-0000-4000-8000-0000000a0001');
      raise exception 'an admin could update memberships.%', stamp;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

do $$
declare
  m record;
begin
  select * into strict m from public.memberships where id = '00000000-0000-4000-8000-0000000a0001';
  if m.updated_at is null or m.updated_by is not null or m.paid_by is not null then
    raise exception 'a membership added in SQL should get updated_at and no author: %', m;
  end if;

  update public.memberships set note = 'Paid at the door' where id = '00000000-0000-4000-8000-0000000a0001';
  select * into strict m from public.memberships where id = '00000000-0000-4000-8000-0000000a0001';
  if m.updated_at is null or m.updated_by <> '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'an edit should set updated_at and updated_by: %', m;
  end if;

  update public.memberships set paid_at = now(), payment_method = 'cash' where id = '00000000-0000-4000-8000-0000000a0001';
  select * into strict m from public.memberships where id = '00000000-0000-4000-8000-0000000a0001';
  if m.paid_by is distinct from '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'marking paid should set paid_by: %', m;
  end if;
end $$;

do $$
declare
  m record;
begin
  insert into public.memberships (profile_id, plan_id, start_date, end_date, price_nok, paid_at, payment_method)
  values ('00000000-0000-4000-8000-00000000ab02', 'junior', '2026-08-01', '2027-06-30', 500, now(), 'vipps')
  returning * into m;
  if m.paid_by is distinct from '00000000-0000-4000-8000-00000000ab01'
    or m.created_by <> '00000000-0000-4000-8000-00000000ab01'
    or m.updated_by is distinct from '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'adding a paid membership should set paid_by, created_by and updated_by: %', m;
  end if;
end $$;

select public.grant_admin('record-authors-c@example.invalid');

do $$
declare
  c record;
  listed record;
begin
  select * into strict c from public.profiles where id = '00000000-0000-4000-8000-00000000ab03';
  if c.admin_since is null or c.admin_granted_by is distinct from '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'grant_admin should set admin_since and admin_granted_by: %', c;
  end if;
  select * into strict listed from public.board_admins() where id = '00000000-0000-4000-8000-00000000ab03';
  if listed.admin_since is distinct from c.admin_since or listed.granted_by_name is distinct from 'Authors Test A'
    or listed.granted_by_email is distinct from 'record-authors-a@example.invalid' then
    raise exception 'board_admins should return admin_since and the granter name and email: %', listed;
  end if;
end $$;

select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ab03", "role": "authenticated"}', true);

do $$
declare
  m record;
begin
  update public.memberships set note = note, price_nok = price_nok where id = '00000000-0000-4000-8000-0000000a0001';
  select * into strict m from public.memberships where id = '00000000-0000-4000-8000-0000000a0001';
  if m.updated_by <> '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'a no-op update should keep updated_by: %', m;
  end if;

  update public.memberships set payment_method = 'vipps' where id = '00000000-0000-4000-8000-0000000a0001';
  select * into strict m from public.memberships where id = '00000000-0000-4000-8000-0000000a0001';
  if m.updated_by <> '00000000-0000-4000-8000-00000000ab03' or m.paid_by <> '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'changing how it was paid should keep paid_by and set updated_by: %', m;
  end if;

  update public.memberships set paid_at = null, payment_method = null where id = '00000000-0000-4000-8000-0000000a0001';
  select * into strict m from public.memberships where id = '00000000-0000-4000-8000-0000000a0001';
  if m.paid_by is not null then
    raise exception 'marking unpaid should clear paid_by: %', m;
  end if;
end $$;

select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ab02", "role": "authenticated"}', true);

do $$
begin
  update public.profiles set admin_since = now() where id = '00000000-0000-4000-8000-00000000ab02';
  raise exception 'a member could set admin_since';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  update public.profiles set admin_granted_by = null where id = '00000000-0000-4000-8000-00000000ab02';
  raise exception 'a member could set admin_granted_by';
exception when insufficient_privilege then null;
end $$;

insert into public.memberships (profile_id, plan_id, start_date, end_date, price_nok, status) values
  ('00000000-0000-4000-8000-00000000ab02', 'request-adult', '2027-08-01', '2028-06-30', 1000, 'requested'),
  ('00000000-0000-4000-8000-00000000ab02', 'request-junior', '2027-08-01', '2028-06-30', 500, 'requested');

select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ab01", "role": "authenticated"}', true);

do $$
declare
  m record;
begin
  select * into strict m from public.memberships where plan_id = 'request-adult';
  if m.created_by <> '00000000-0000-4000-8000-00000000ab02' or m.decided_at is not null then
    raise exception 'a request should be created by the member and not decided: %', m;
  end if;

  update public.memberships set status = 'active' where plan_id = 'request-adult';
  select * into strict m from public.memberships where plan_id = 'request-adult';
  if m.decided_at is null or m.decided_by is distinct from '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'approving should set decided_at and decided_by: %', m;
  end if;

  update public.memberships set status = 'declined' where plan_id = 'request-junior';
  select * into strict m from public.memberships where plan_id = 'request-junior';
  if m.decided_at is null or m.decided_by is distinct from '00000000-0000-4000-8000-00000000ab01' then
    raise exception 'declining should set decided_at and decided_by: %', m;
  end if;

  update public.memberships set status = 'requested' where plan_id = 'request-junior';
  select * into strict m from public.memberships where plan_id = 'request-junior';
  if m.decided_at is not null or m.decided_by is not null then
    raise exception 'undoing a decline should clear decided_*: %', m;
  end if;
end $$;

insert into public.shift_volunteers (event_id, shift_key, profile_id)
values ('record-authors-event', 'kiosk-1', '00000000-0000-4000-8000-00000000ab02');

select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ab03", "role": "authenticated"}', true);

select public.revoke_admin('00000000-0000-4000-8000-00000000ab01');

reset role;

do $$
declare
  a record;
begin
  select * into strict a from public.profiles where id = '00000000-0000-4000-8000-00000000ab01';
  if a.is_admin or a.admin_since is not null or a.admin_granted_by is not null then
    raise exception 'revoke_admin should clear admin_since and admin_granted_by: %', a;
  end if;
end $$;

delete from auth.users where id = '00000000-0000-4000-8000-00000000ab03';

do $$
declare
  m record;
begin
  select * into strict m from public.memberships where id = '00000000-0000-4000-8000-0000000a0001';
  if m.updated_by is not null or m.updated_at is null then
    raise exception 'deleting the last editor should null updated_by and keep updated_at: %', m;
  end if;
end $$;

delete from auth.users where id = '00000000-0000-4000-8000-00000000ab01';

do $$
begin
  if (select created_by from public.shift_volunteers where event_id = 'record-authors-event') is not null then
    raise exception 'deleting who added a volunteer should null created_by';
  end if;
end $$;

select 'record authors tests passed' as result;

rollback;
