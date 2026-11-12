create or replace function private.shuttlekaos_summary(p_session public.shuttlekaos_sessions, p_uid uuid)
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
    'format', p_session.data -> 'settings' ->> 'format',
    'style', p_session.data -> 'settings' ->> 'style',
    'myResult', (
      select json_build_object('rank', r.rank, 'played', r.played, 'won', r.won, 'pointsFor', r.points_for)
      from public.shuttlekaos_results r
      where r.session_id = p_session.id and r.profile_id = p_uid
    )
  );
$$;
