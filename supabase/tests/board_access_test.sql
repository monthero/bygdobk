begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000000ba01', 'board-access-a@example.invalid', '{"full_name": "Board Test A"}'),
  ('00000000-0000-4000-8000-00000000ba02', 'board-access-b@example.invalid', '{"full_name": "Board Test B"}'),
  ('00000000-0000-4000-8000-00000000ba03', 'board-access-c@example.invalid', '{"full_name": "Board Test C"}');

-- Only test A is an admin while this runs; the rollback brings the real admins back.
update public.profiles set is_admin = false where is_admin;
update public.profiles set is_admin = true where id = '00000000-0000-4000-8000-00000000ba01';

set local role anon;

do $$
begin
  perform public.board_admins();
  raise exception 'anon could list admins';
exception when insufficient_privilege then null;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ba02", "role": "authenticated"}', true);

do $$
begin
  perform public.board_admins();
  raise exception 'a member could list admins';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  perform public.grant_admin('board-access-b@example.invalid');
  raise exception 'a member could make themselves admin';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  perform public.revoke_admin('00000000-0000-4000-8000-00000000ba01');
  raise exception 'a member could remove an admin';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  update public.profiles set is_admin = true where id = '00000000-0000-4000-8000-00000000ba02';
  raise exception 'a member could set is_admin on their own profile';
exception when insufficient_privilege then null;
end $$;

select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ba01", "role": "authenticated"}', true);

do $$
begin
  if (select array_agg(id) from public.board_admins()) <> array['00000000-0000-4000-8000-00000000ba01'::uuid] then
    raise exception 'board_admins should list only test A';
  end if;
end $$;

do $$
begin
  perform public.revoke_admin('00000000-0000-4000-8000-00000000ba01');
  raise exception 'the last admin could remove themselves';
exception when sqlstate 'BA003' then null;
end $$;

do $$
begin
  perform public.grant_admin('nobody-here@example.invalid');
  raise exception 'grant_admin accepted an email without an account';
exception when sqlstate 'BA001' then null;
end $$;

do $$
declare
  added record;
begin
  select * into strict added from public.grant_admin('  Board-Access-B@Example.INVALID ');
  if added.id <> '00000000-0000-4000-8000-00000000ba02' or added.name <> 'Board Test B' then
    raise exception 'grant_admin returned the wrong profile: %', added;
  end if;
  select * into strict added from public.grant_admin('board-access-b@example.invalid');
  if added.id <> '00000000-0000-4000-8000-00000000ba02' then
    raise exception 'granting an admin twice should return the same profile';
  end if;
  if (select array_agg(name) from public.board_admins()) <> array['Board Test A', 'Board Test B'] then
    raise exception 'board_admins should list A and B sorted by name';
  end if;
end $$;

do $$
begin
  perform public.revoke_admin('00000000-0000-4000-8000-00000000ba01');
  raise exception 'an admin could remove themselves';
exception when sqlstate 'BA002' then null;
end $$;

do $$
begin
  perform public.revoke_admin('00000000-0000-4000-8000-00000000ba02');
  if exists (select 1 from public.board_admins() where id = '00000000-0000-4000-8000-00000000ba02') then
    raise exception 'revoke_admin did not remove B';
  end if;
  perform public.revoke_admin('00000000-0000-4000-8000-00000000ba02');
  perform public.grant_admin('board-access-c@example.invalid');
end $$;

select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000ba03", "role": "authenticated"}', true);

do $$
begin
  perform public.revoke_admin('00000000-0000-4000-8000-00000000ba01');
  if (select count(*) from public.board_admins()) <> 1 then
    raise exception 'C should be the only admin left';
  end if;
  begin
    perform public.revoke_admin('00000000-0000-4000-8000-00000000ba03');
    raise exception 'the last admin could remove themselves';
  exception when sqlstate 'BA003' then null;
  end;
end $$;

reset role;

select 'board access tests passed' as result;

rollback;
