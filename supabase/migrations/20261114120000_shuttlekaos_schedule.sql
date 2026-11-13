begin;

create table public.shuttlekaos_series (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  template jsonb not null,
  first_on date not null,
  local_time time not null,
  every_weeks int not null check (every_weeks in (1, 2)),
  ends_on date check (ends_on >= first_on),
  planned_until timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index shuttlekaos_series_owner_idx on public.shuttlekaos_series (owner_id);

alter table public.shuttlekaos_series enable row level security;
revoke all on table public.shuttlekaos_series from anon, authenticated;

alter table public.shuttlekaos_sessions
  add column scheduled_at timestamptz,
  add column series_id uuid references public.shuttlekaos_series (id) on delete set null;

create index shuttlekaos_sessions_series_idx on public.shuttlekaos_sessions (series_id, scheduled_at)
  where series_id is not null;

create function private.shuttlekaos_idle_from(p_session public.shuttlekaos_sessions)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select case
    when p_session.status = 'open' then greatest(p_session.updated_at, p_session.scheduled_at)
    else p_session.updated_at
  end;
$$;

create function private.shuttlekaos_is_active(p_session public.shuttlekaos_sessions)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.shuttlekaos_is_active(p_session.status, private.shuttlekaos_idle_from(p_session));
$$;

-- Due: running, or open and starting within the hour. Sessions further ahead don't make players busy.
create function private.shuttlekaos_is_due(p_status text, p_scheduled_at timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_status <> 'open' or p_scheduled_at is null or p_scheduled_at <= now() + interval '1 hour';
$$;

create function private.shuttlekaos_is_busy(p_session public.shuttlekaos_sessions)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.shuttlekaos_is_active(p_session)
    and private.shuttlekaos_is_due(p_session.status, p_session.scheduled_at);
$$;

drop function private.shuttlekaos_settled(jsonb, text, timestamptz);

create function private.shuttlekaos_settled(p_session public.shuttlekaos_sessions)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case
    when p_session.status in ('open', 'running') and not private.shuttlekaos_is_active(p_session) then
      p_session.data || jsonb_build_object(
        'status', 'finished',
        'finishedAt', private.shuttlekaos_iso(private.shuttlekaos_idle_from(p_session))
      )
    else p_session.data
  end;
$$;

create function private.shuttlekaos_series_info(p_series uuid)
returns json
language sql
stable
set search_path = ''
as $$
  select json_build_object(
    'id', r.id,
    'weekday', extract(isodow from r.first_on)::int,
    'every', r.every_weeks,
    'endsOn', r.ends_on
  )
  from public.shuttlekaos_series r
  where r.id = p_series and r.ended_at is null;
$$;

create function private.shuttlekaos_fill_series(p_series uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  dates_ahead constant int := 2;
  v_series public.shuttlekaos_series;
  v_open int;
  v_day date;
  v_at timestamptz;
  v_now text := private.shuttlekaos_iso(now());
begin
  select * into v_series from public.shuttlekaos_series where id = p_series and ended_at is null for update;
  if not found then
    return;
  end if;

  select count(*) into v_open
  from public.shuttlekaos_sessions s
  where s.series_id = p_series and s.status = 'open' and s.scheduled_at > now();

  v_day := (v_series.planned_until at time zone 'Europe/Oslo')::date;
  while v_open < dates_ahead loop
    v_day := v_day + 7 * v_series.every_weeks;
    v_at := (v_day + v_series.local_time) at time zone 'Europe/Oslo';
    exit when v_day > v_series.ends_on;
    continue when v_at <= now();
    perform public.shuttlekaos_write(
      v_series.owner_id,
      v_series.template || jsonb_build_object(
        'id', gen_random_uuid(),
        'createdAt', v_now,
        'updatedAt', v_now,
        'scheduledAt', private.shuttlekaos_iso(v_at),
        'seriesId', p_series
      ),
      null,
      '{}',
      '[]'
    );
    v_series.planned_until := v_at;
    v_open := v_open + 1;
  end loop;

  update public.shuttlekaos_series set planned_until = v_series.planned_until where id = p_series;
end;
$$;

create function public.shuttlekaos_create_series(p_owner uuid, p_data jsonb, p_every int, p_ends_on date)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_at timestamptz := (p_data ->> 'scheduledAt')::timestamptz;
  v_local timestamp := v_at at time zone 'Europe/Oslo';
  v_series uuid;
  v_written json;
begin
  if v_at is null or jsonb_typeof(p_data -> 'players') is distinct from 'array' then
    raise exception 'Invalid series' using errcode = '22023';
  end if;

  insert into public.shuttlekaos_series (owner_id, template, first_on, local_time, every_weeks, ends_on, planned_until)
  values (
    p_owner,
    p_data || jsonb_build_object(
      'players', (
        select coalesce(jsonb_agg(pl), '[]'::jsonb)
        from jsonb_array_elements(p_data -> 'players') as pl
        where lower(pl ->> 'profileId') = p_owner::text
      ),
      'pairs', '[]'::jsonb
    ),
    v_local::date,
    v_local::time,
    p_every,
    p_ends_on,
    v_at
  )
  returning id into v_series;

  v_written := public.shuttlekaos_write(p_owner, p_data || jsonb_build_object('seriesId', v_series), null, '{}', '[]');
  perform private.shuttlekaos_fill_series(v_series);
  return v_written;
end;
$$;

create function public.end_shuttlekaos_series(p_series uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Log in first' using errcode = '42501';
  end if;
  update public.shuttlekaos_series
  set ended_at = coalesce(ended_at, now())
  where id = p_series and owner_id = auth.uid();
  if not found then
    raise exception 'No such series' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.shuttlekaos_write(
  p_owner uuid,
  p_data jsonb,
  p_expected int,
  p_removed uuid[],
  p_results jsonb
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_new_per_day constant int := 30;
  max_bytes constant int := 262144;
  uuid_pattern constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_id uuid;
  v_status text := p_data ->> 'status';
  v_scheduled timestamptz;
  v_series uuid;
  v_revision int;
  v_was_active boolean := false;
  v_stored public.shuttlekaos_sessions;
  v_data jsonb;
  v_code text;
  v_linked uuid[];
  v_check uuid[];
  v_busy uuid[];
  v_names json;
  v_tries int := 0;
begin
  if p_owner is null or p_data is null or jsonb_typeof(p_data) <> 'object'
    or octet_length(p_data::text) > max_bytes
    or coalesce(p_data ->> 'id', '') !~* uuid_pattern
    or coalesce(v_status, '') not in ('open', 'running', 'finished')
    or jsonb_typeof(p_data -> 'players') is distinct from 'array'
    or jsonb_typeof(p_data -> 'settings' -> 'levels') is distinct from 'array' then
    raise exception 'Invalid session' using errcode = '22023';
  end if;
  v_id := (p_data ->> 'id')::uuid;
  v_scheduled := (p_data ->> 'scheduledAt')::timestamptz;
  v_series := (p_data ->> 'seriesId')::uuid;
  if v_series is not null and not exists (
    select 1 from public.shuttlekaos_series r where r.id = v_series and r.owner_id = p_owner
  ) then
    raise exception 'Invalid session' using errcode = '22023';
  end if;

  if p_expected is null then
    if (select count(*) from public.shuttlekaos_sessions s
        where s.owner_id = p_owner and s.created_at > now() - interval '1 day') >= max_new_per_day then
      raise exception 'Too many new sessions today' using errcode = 'PT429';
    end if;
    v_revision := 1;
  else
    select * into v_stored
    from public.shuttlekaos_sessions s
    where s.id = v_id
    for update;
    if not found then
      raise exception 'No such session' using errcode = 'P0002';
    end if;
    if v_stored.owner_id <> p_owner then
      raise exception 'Only the organizer can change this session' using errcode = '42501';
    end if;
    if v_stored.revision <> p_expected then
      raise exception 'Session changed meanwhile' using errcode = 'SKSTL';
    end if;
    v_was_active := private.shuttlekaos_is_active(v_stored);
    v_revision := v_stored.revision + 1;
  end if;

  v_data := jsonb_set(p_data, '{revision}', to_jsonb(v_revision));

  select coalesce(array_agg(distinct p.id order by p.id), '{}') into v_linked
  from jsonb_array_elements(v_data -> 'players') as pl
  join public.profiles p
    on p.id = case when pl ->> 'profileId' ~* uuid_pattern then (pl ->> 'profileId')::uuid end
  where not (p.id = any(coalesce(p_removed, '{}')));

  if v_status in ('open', 'running') and private.shuttlekaos_is_due(v_status, v_scheduled)
    and cardinality(v_linked) > 0 then
    -- Locking the profiles makes two writes that link the same account wait for each other.
    perform 1 from public.profiles where id = any(v_linked) order by id for no key update;
    if v_was_active then
      select coalesce(array_agg(l), '{}') into v_check
      from unnest(v_linked) as l
      where not exists (
        select 1 from public.shuttlekaos_players sp where sp.session_id = v_id and sp.profile_id = l
      );
    else
      v_check := v_linked;
    end if;
    select array_agg(distinct sp.profile_id) into v_busy
    from public.shuttlekaos_players sp
    join public.shuttlekaos_sessions s on s.id = sp.session_id
    where sp.profile_id = any(v_check)
      and s.id <> v_id
      and private.shuttlekaos_is_busy(s);
    if v_busy is not null then
      select json_agg(pl ->> 'name' order by n) into v_names
      from jsonb_array_elements(v_data -> 'players') with ordinality as t(pl, n)
      where lower(pl ->> 'profileId') = any(v_busy::text[]);
      raise exception 'A player is already in another session'
        using errcode = 'SKBSY', detail = coalesce(v_names, '[]'::json)::text;
    end if;
  end if;

  if p_expected is null then
    loop
      begin
        insert into public.shuttlekaos_sessions (
          id, owner_id, share_code, title, status, is_public, levels, data, revision,
          started_at, finished_at, removed_profile_ids, scheduled_at, series_id
        )
        values (
          v_id, p_owner, private.shuttlekaos_share_code(), trim(v_data ->> 'title'), v_status,
          coalesce((v_data ->> 'isPublic')::boolean, true),
          array(select jsonb_array_elements_text(v_data -> 'settings' -> 'levels')),
          v_data, v_revision,
          (v_data ->> 'startedAt')::timestamptz, (v_data ->> 'finishedAt')::timestamptz,
          coalesce(p_removed, '{}'), v_scheduled, v_series
        )
        returning share_code into v_code;
        exit;
      exception when unique_violation then
        -- Retries a taken share code; a taken id fails every time and ends up raised.
        v_tries := v_tries + 1;
        if v_tries >= 5 then
          raise;
        end if;
      end;
    end loop;
  else
    update public.shuttlekaos_sessions
    set title = trim(v_data ->> 'title'),
      status = v_status,
      is_public = coalesce((v_data ->> 'isPublic')::boolean, true),
      levels = array(select jsonb_array_elements_text(v_data -> 'settings' -> 'levels')),
      data = v_data,
      revision = v_revision,
      updated_at = now(),
      started_at = (v_data ->> 'startedAt')::timestamptz,
      finished_at = (v_data ->> 'finishedAt')::timestamptz,
      removed_profile_ids = coalesce(p_removed, '{}'),
      scheduled_at = v_scheduled,
      series_id = v_series
    where id = v_id
    returning share_code into v_code;
  end if;

  delete from public.shuttlekaos_players
  where session_id = v_id and profile_id <> all(v_linked);

  insert into public.shuttlekaos_players (session_id, profile_id)
  select v_id, unnest(v_linked)
  on conflict do nothing;

  delete from public.shuttlekaos_results where session_id = v_id;

  insert into public.shuttlekaos_results (
    session_id, profile_id, rank, played, won, lost, drawn, sets_won, sets_lost, points_for, points_against
  )
  select v_id, r."profileId", r.rank, r.played, r.won, r.lost, r.drawn,
    r."setsWon", r."setsLost", r."pointsFor", r."pointsAgainst"
  from jsonb_to_recordset(coalesce(p_results, '[]'::jsonb)) as r(
    "profileId" uuid, rank int, played int, won int, lost int, drawn int,
    "setsWon" int, "setsLost" int, "pointsFor" int, "pointsAgainst" int
  )
  where r."profileId" = any(v_linked)
  on conflict do nothing;

  if v_series is not null and v_stored.status = 'open' and v_status = 'running' then
    -- Adding the next dates must never stop a session from starting.
    begin
      perform private.shuttlekaos_fill_series(v_series);
    exception when others then
      raise warning 'ShuttleKaos series % not filled: %', v_series, sqlerrm;
    end;
  end if;

  return json_build_object('shareCode', v_code, 'session', v_data);
end;
$$;

create or replace function public.shuttlekaos_session(p_code text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'isOwner', coalesce(s.owner_id = (select auth.uid()), false),
    'myPlayerId', (
      select pl ->> 'id'
      from jsonb_array_elements(s.data -> 'players') as pl
      where (select auth.uid()) is not null and pl ->> 'profileId' = (select auth.uid())::text
      limit 1
    ),
    'shareCode', s.share_code,
    'series', private.shuttlekaos_series_info(s.series_id),
    'session', case
      when s.owner_id = (select auth.uid()) or exists (
        select 1 from public.shuttlekaos_players sp where sp.session_id = s.id and sp.profile_id = (select auth.uid())
      ) then private.shuttlekaos_settled(s)
      else private.shuttlekaos_hide_accounts(private.shuttlekaos_settled(s))
    end
  )
  from public.shuttlekaos_sessions s
  where s.share_code = lower(trim(p_code));
$$;

create or replace function private.shuttlekaos_settle_mine(p_uid uuid)
returns void
language sql
set search_path = ''
as $$
  update public.shuttlekaos_sessions s
  set status = 'finished',
    finished_at = private.shuttlekaos_idle_from(s),
    data = private.shuttlekaos_settled(s)
  where s.status in ('open', 'running')
    and not private.shuttlekaos_is_active(s)
    and s.id in (select private.shuttlekaos_my_ids(p_uid));
$$;

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
    'maxPlayers', p_session.data -> 'maxPlayers',
    'createdAt', private.shuttlekaos_iso(p_session.created_at),
    'scheduledAt', private.shuttlekaos_iso(p_session.scheduled_at),
    'startedAt', private.shuttlekaos_iso(p_session.started_at),
    'finishedAt', private.shuttlekaos_iso(p_session.finished_at),
    'series', private.shuttlekaos_series_info(p_session.series_id),
    'isOwner', p_session.owner_id = p_uid,
    'isActive', private.shuttlekaos_is_active(p_session),
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

create or replace function public.my_shuttlekaos_active()
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
    select coalesce(json_agg(
      private.shuttlekaos_summary(s, v_uid)
      order by private.shuttlekaos_is_due(s.status, s.scheduled_at) desc, s.scheduled_at nulls first, s.created_at desc, s.id
    ), '[]'::json)
    from public.shuttlekaos_sessions s
    where s.status in ('open', 'running')
      and s.id in (select private.shuttlekaos_my_ids(v_uid))
  );
end;
$$;

create or replace function public.public_shuttlekaos_sessions(p_levels text[])
returns json
language sql
stable
security definer
set search_path = ''
as $$
  with listed as (
    select s.*, o.name as organizer_name
    from public.shuttlekaos_sessions s
    join public.profiles o on o.id = s.owner_id
    where s.is_public
      and private.shuttlekaos_is_active(s)
      and (coalesce(cardinality(p_levels), 0) = 0 or cardinality(s.levels) = 0 or s.levels && p_levels)
    order by s.status = 'open' desc, s.scheduled_at nulls first, s.created_at desc, s.id
    limit 50
  )
  select coalesce(json_agg(json_build_object(
    'id', l.id,
    'shareCode', l.share_code,
    'title', l.title,
    'status', l.status,
    'isPublic', l.is_public,
    'levels', l.levels,
    'format', l.data -> 'settings' ->> 'format',
    'style', l.data -> 'settings' ->> 'style',
    'organizerId', l.owner_id,
    'organizerName', l.organizer_name,
    'playerCount', jsonb_array_length(l.data -> 'players'),
    'maxPlayers', l.data -> 'maxPlayers',
    'createdAt', private.shuttlekaos_iso(l.created_at),
    'scheduledAt', private.shuttlekaos_iso(l.scheduled_at),
    'startedAt', private.shuttlekaos_iso(l.started_at),
    'finishedAt', private.shuttlekaos_iso(l.finished_at),
    'series', private.shuttlekaos_series_info(l.series_id),
    'location', l.data -> 'location'
  ) order by l.status = 'open' desc, l.scheduled_at nulls first, l.created_at desc, l.id), '[]'::json)
  from listed l;
$$;

create or replace function public.search_shuttlekaos_accounts(p_query text)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_query text := trim(coalesce(p_query, ''));
  v_escaped text;
begin
  if auth.uid() is null then
    raise exception 'Log in to find players' using errcode = '42501';
  end if;
  if char_length(v_query) not between 2 and 100 then
    raise exception 'Search needs 2 to 100 characters' using errcode = '22023';
  end if;
  v_escaped := replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_');
  return (
    with found as (
      select p.id, p.name, p.avatar_url, p.name ilike (v_escaped || '%') as prefix
      from public.profiles p
      where p.shuttlekaos_findable and p.name ilike ('%' || v_escaped || '%')
      order by prefix desc, lower(p.name), p.id
      limit 8
    )
    select coalesce(json_agg(json_build_object(
      'profileId', f.id,
      'name', f.name,
      'avatarUrl', f.avatar_url,
      'busy', exists (
        select 1
        from public.shuttlekaos_players sp
        join public.shuttlekaos_sessions s on s.id = sp.session_id
        where sp.profile_id = f.id and private.shuttlekaos_is_busy(s)
      )
    ) order by f.prefix desc, lower(f.name), f.id), '[]'::json)
    from found f
  );
end;
$$;

revoke all on function private.shuttlekaos_idle_from(public.shuttlekaos_sessions) from public, anon, authenticated;
revoke all on function private.shuttlekaos_is_active(public.shuttlekaos_sessions) from public, anon, authenticated;
revoke all on function private.shuttlekaos_is_due(text, timestamptz) from public, anon, authenticated;
revoke all on function private.shuttlekaos_is_busy(public.shuttlekaos_sessions) from public, anon, authenticated;
revoke all on function private.shuttlekaos_settled(public.shuttlekaos_sessions) from public, anon, authenticated;
revoke all on function private.shuttlekaos_series_info(uuid) from public, anon, authenticated;
revoke all on function private.shuttlekaos_fill_series(uuid) from public, anon, authenticated;
revoke all on function public.shuttlekaos_create_series(uuid, jsonb, int, date) from public, anon, authenticated;
revoke all on function public.end_shuttlekaos_series(uuid) from public, anon;
grant execute on function public.shuttlekaos_create_series(uuid, jsonb, int, date) to service_role;
grant execute on function public.end_shuttlekaos_series(uuid) to authenticated;

commit;
