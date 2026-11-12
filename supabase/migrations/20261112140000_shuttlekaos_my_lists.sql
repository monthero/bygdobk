create function private.shuttlekaos_my_ids(p_uid uuid)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select id from public.shuttlekaos_sessions where owner_id = p_uid
  union
  select session_id from public.shuttlekaos_players where profile_id = p_uid;
$$;

create function private.shuttlekaos_settle_mine(p_uid uuid)
returns void
language sql
set search_path = ''
as $$
  update public.shuttlekaos_sessions s
  set status = 'finished',
    finished_at = s.updated_at,
    data = private.shuttlekaos_settled(s.data, s.status, s.updated_at)
  where s.status in ('open', 'running')
    and not private.shuttlekaos_is_active(s.status, s.updated_at)
    and s.id in (select private.shuttlekaos_my_ids(p_uid));
$$;

create function private.shuttlekaos_summary(p_session public.shuttlekaos_sessions, p_uid uuid)
returns json
language sql
stable
set search_path = ''
as $$
  select json_build_object(
    'id', p_session.id,
    'shareCode', p_session.share_code,
    'title', p_session.title,
    'status', p_session.status,
    'isPublic', p_session.is_public,
    'levels', p_session.levels,
    'organizerName', (select o.name from public.profiles o where o.id = p_session.owner_id),
    'playerCount', jsonb_array_length(p_session.data -> 'players'),
    'createdAt', private.shuttlekaos_iso(p_session.created_at),
    'startedAt', private.shuttlekaos_iso(p_session.started_at),
    'finishedAt', private.shuttlekaos_iso(p_session.finished_at),
    'isOwner', p_session.owner_id = p_uid,
    'isActive', private.shuttlekaos_is_active(p_session.status, p_session.updated_at),
    'location', p_session.data -> 'location',
    'myResult', (
      select json_build_object('rank', r.rank, 'played', r.played, 'won', r.won, 'pointsFor', r.points_for)
      from public.shuttlekaos_results r
      where r.session_id = p_session.id and r.profile_id = p_uid
    )
  );
$$;

create function public.my_shuttlekaos_active()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Log in to see your sessions' using errcode = '42501';
  end if;

  perform private.shuttlekaos_settle_mine(v_uid);

  return (
    select coalesce(json_agg(private.shuttlekaos_summary(s, v_uid) order by s.created_at desc, s.id), '[]'::json)
    from public.shuttlekaos_sessions s
    where s.status in ('open', 'running')
      and s.id in (select private.shuttlekaos_my_ids(v_uid))
  );
end;
$$;

create function public.my_shuttlekaos_history(p_offset int, p_limit int)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_offset int := greatest(coalesce(p_offset, 0), 0);
begin
  if v_uid is null then
    raise exception 'Log in to see your sessions' using errcode = '42501';
  end if;

  perform private.shuttlekaos_settle_mine(v_uid);

  return (
    with finished as (
      select s.*
      from public.shuttlekaos_sessions s
      where s.status = 'finished'
        and s.id in (select private.shuttlekaos_my_ids(v_uid))
    ),
    page as (
      select f.*
      from finished f
      order by coalesce(f.started_at, f.created_at) desc, f.id
      offset v_offset
      limit v_limit
    )
    select json_build_object(
      'total', (select count(*) from finished),
      'items', coalesce(
        (select json_agg(
          private.shuttlekaos_summary(p::public.shuttlekaos_sessions, v_uid)
          order by coalesce(p.started_at, p.created_at) desc, p.id
        ) from page p),
        '[]'::json
      )
    )
  );
end;
$$;

revoke all on function private.shuttlekaos_my_ids(uuid) from public, anon, authenticated;
revoke all on function private.shuttlekaos_settle_mine(uuid) from public, anon, authenticated;
revoke all on function private.shuttlekaos_summary(public.shuttlekaos_sessions, uuid) from public, anon, authenticated;
revoke all on function public.my_shuttlekaos_active() from public, anon;
revoke all on function public.my_shuttlekaos_history(int, int) from public, anon;
grant execute on function public.my_shuttlekaos_active() to authenticated;
grant execute on function public.my_shuttlekaos_history(int, int) to authenticated;
