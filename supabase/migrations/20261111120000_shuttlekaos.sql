begin;

alter table public.profiles add column shuttlekaos_findable boolean not null default true;

create table public.shuttlekaos_sessions (
  id uuid primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  share_code text not null unique,
  title text not null check (char_length(title) <= 80),
  status text not null check (status in ('open', 'running', 'finished')),
  is_public boolean not null default true,
  levels text[] not null default '{}' check (levels <@ array['E', 'A', 'B', 'C', 'D']),
  data jsonb not null,
  revision int not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  removed_profile_ids uuid[] not null default '{}'
);

create index shuttlekaos_sessions_owner_idx on public.shuttlekaos_sessions (owner_id, created_at);
create index shuttlekaos_sessions_public_idx on public.shuttlekaos_sessions (updated_at)
  where is_public and status in ('open', 'running');

create table public.shuttlekaos_players (
  session_id uuid not null references public.shuttlekaos_sessions (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (session_id, profile_id)
);

create index shuttlekaos_players_profile_idx on public.shuttlekaos_players (profile_id);

create table public.shuttlekaos_results (
  session_id uuid not null,
  profile_id uuid not null,
  rank int not null check (rank > 0),
  played int not null check (played >= 0),
  won int not null check (won >= 0),
  lost int not null check (lost >= 0),
  drawn int not null check (drawn >= 0),
  sets_won int not null check (sets_won >= 0),
  sets_lost int not null check (sets_lost >= 0),
  points_for int not null check (points_for >= 0),
  points_against int not null check (points_against >= 0),
  primary key (session_id, profile_id),
  foreign key (session_id, profile_id) references public.shuttlekaos_players (session_id, profile_id) on delete cascade
);

create index shuttlekaos_results_profile_idx on public.shuttlekaos_results (profile_id);

alter table public.shuttlekaos_sessions enable row level security;
alter table public.shuttlekaos_players enable row level security;
alter table public.shuttlekaos_results enable row level security;

revoke all on table public.shuttlekaos_sessions from anon, authenticated;
revoke all on table public.shuttlekaos_players from anon, authenticated;
revoke all on table public.shuttlekaos_results from anon, authenticated;

create function private.shuttlekaos_idle_limit()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '60 minutes';
$$;

create function private.shuttlekaos_is_active(p_status text, p_updated_at timestamptz)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_status in ('open', 'running') and p_updated_at > now() - private.shuttlekaos_idle_limit();
$$;

create function private.shuttlekaos_iso(p_at timestamptz)
returns text
language sql
immutable
set search_path = ''
as $$
  select to_char(p_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;

create function private.shuttlekaos_settled(p_data jsonb, p_status text, p_updated_at timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case
    when p_status in ('open', 'running') and not private.shuttlekaos_is_active(p_status, p_updated_at) then
      p_data || jsonb_build_object('status', 'finished', 'finishedAt', private.shuttlekaos_iso(p_updated_at))
    else p_data
  end;
$$;

create function private.shuttlekaos_share_code()
returns text
language sql
volatile
set search_path = ''
as $$
  -- Byte 6 holds the uuid version, so it isn't random.
  select string_agg(substr('23456789abcdefghijkmnpqrstuvwxyz', (get_byte(r.b, i) & 31) + 1, 1), '' order by i)
  from (select uuid_send(gen_random_uuid()) as b) r
  cross join generate_series(0, 10) as i
  where i <> 6;
$$;

-- Uploaded avatar URLs contain the account id, so they go too.
create function private.shuttlekaos_hide_accounts(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when jsonb_typeof(p_data -> 'players') is distinct from 'array' then p_data
    else jsonb_set(p_data, '{players}', (
      select coalesce(jsonb_agg(
        case
          when jsonb_typeof(pl) <> 'object' then pl
          when pl ->> 'avatarUrl' ~* '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
            then pl || '{"profileId": null, "avatarUrl": null}'::jsonb
          else pl || '{"profileId": null}'::jsonb
        end
        order by n), '[]'::jsonb)
      from jsonb_array_elements(p_data -> 'players') with ordinality as t(pl, n)
    ))
  end;
$$;

create function public.shuttlekaos_write(
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
  v_revision int;
  v_was_active boolean := false;
  v_owner uuid;
  v_stored int;
  v_stored_status text;
  v_stored_updated timestamptz;
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

  if p_expected is null then
    if (select count(*) from public.shuttlekaos_sessions s
        where s.owner_id = p_owner and s.created_at > now() - interval '1 day') >= max_new_per_day then
      raise exception 'Too many new sessions today' using errcode = 'PT429';
    end if;
    v_revision := 1;
  else
    select s.owner_id, s.revision, s.status, s.updated_at
    into v_owner, v_stored, v_stored_status, v_stored_updated
    from public.shuttlekaos_sessions s
    where s.id = v_id
    for update;
    if not found then
      raise exception 'No such session' using errcode = 'P0002';
    end if;
    if v_owner <> p_owner then
      raise exception 'Only the organizer can change this session' using errcode = '42501';
    end if;
    if v_stored <> p_expected then
      raise exception 'Session changed meanwhile' using errcode = 'SKSTL';
    end if;
    v_was_active := private.shuttlekaos_is_active(v_stored_status, v_stored_updated);
    v_revision := v_stored + 1;
  end if;

  v_data := jsonb_set(p_data, '{revision}', to_jsonb(v_revision));

  select coalesce(array_agg(distinct p.id order by p.id), '{}') into v_linked
  from jsonb_array_elements(v_data -> 'players') as pl
  join public.profiles p
    on p.id = case when pl ->> 'profileId' ~* uuid_pattern then (pl ->> 'profileId')::uuid end
  where not (p.id = any(coalesce(p_removed, '{}')));

  if v_status in ('open', 'running') and cardinality(v_linked) > 0 then
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
      and private.shuttlekaos_is_active(s.status, s.updated_at);
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
          started_at, finished_at, removed_profile_ids
        )
        values (
          v_id, p_owner, private.shuttlekaos_share_code(), trim(v_data ->> 'title'), v_status,
          coalesce((v_data ->> 'isPublic')::boolean, true),
          array(select jsonb_array_elements_text(v_data -> 'settings' -> 'levels')),
          v_data, v_revision,
          (v_data ->> 'startedAt')::timestamptz, (v_data ->> 'finishedAt')::timestamptz,
          coalesce(p_removed, '{}')
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
      removed_profile_ids = coalesce(p_removed, '{}')
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

  return json_build_object('shareCode', v_code, 'session', v_data);
end;
$$;

create function public.shuttlekaos_session(p_code text)
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
    'session', case
      when s.owner_id = (select auth.uid()) or exists (
        select 1 from public.shuttlekaos_players sp where sp.session_id = s.id and sp.profile_id = (select auth.uid())
      ) then private.shuttlekaos_settled(s.data, s.status, s.updated_at)
      else private.shuttlekaos_hide_accounts(private.shuttlekaos_settled(s.data, s.status, s.updated_at))
    end
  )
  from public.shuttlekaos_sessions s
  where s.share_code = lower(trim(p_code));
$$;

create function public.public_shuttlekaos_sessions(p_levels text[])
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
      and private.shuttlekaos_is_active(s.status, s.updated_at)
      and (coalesce(cardinality(p_levels), 0) = 0 or cardinality(s.levels) = 0 or s.levels && p_levels)
    order by s.status = 'open' desc, s.created_at desc, s.id
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
    'createdAt', private.shuttlekaos_iso(l.created_at),
    'startedAt', private.shuttlekaos_iso(l.started_at),
    'finishedAt', private.shuttlekaos_iso(l.finished_at)
  ) order by l.status = 'open' desc, l.created_at desc, l.id), '[]'::json)
  from listed l;
$$;

create function public.my_shuttlekaos_sessions()
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

  update public.shuttlekaos_sessions s
  set status = 'finished',
    finished_at = s.updated_at,
    data = private.shuttlekaos_settled(s.data, s.status, s.updated_at)
  where s.status in ('open', 'running')
    and not private.shuttlekaos_is_active(s.status, s.updated_at)
    and s.id in (
      select id from public.shuttlekaos_sessions where owner_id = v_uid
      union
      select session_id from public.shuttlekaos_players where profile_id = v_uid
    );

  return (
    with mine as (
      select s.*, o.name as organizer_name, private.shuttlekaos_is_active(s.status, s.updated_at) as is_active
      from public.shuttlekaos_sessions s
      join public.profiles o on o.id = s.owner_id
      where s.id in (
        select id from public.shuttlekaos_sessions where owner_id = v_uid
        union
        select session_id from public.shuttlekaos_players where profile_id = v_uid
      )
      order by is_active desc, coalesce(s.started_at, s.created_at) desc, s.id
      limit 100
    )
    select coalesce(json_agg(json_build_object(
      'id', m.id,
      'shareCode', m.share_code,
      'title', m.title,
      'status', m.status,
      'isPublic', m.is_public,
      'levels', m.levels,
      'organizerName', m.organizer_name,
      'playerCount', jsonb_array_length(m.data -> 'players'),
      'createdAt', private.shuttlekaos_iso(m.created_at),
      'startedAt', private.shuttlekaos_iso(m.started_at),
      'finishedAt', private.shuttlekaos_iso(m.finished_at),
      'isOwner', m.owner_id = v_uid,
      'isActive', m.is_active,
      'myResult', (
        select json_build_object('rank', r.rank, 'played', r.played, 'won', r.won, 'pointsFor', r.points_for)
        from public.shuttlekaos_results r
        where r.session_id = m.id and r.profile_id = v_uid
      )
    ) order by m.is_active desc, coalesce(m.started_at, m.created_at) desc, m.id), '[]'::json)
    from mine m
  );
end;
$$;

create function public.search_shuttlekaos_accounts(p_query text)
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
        where sp.profile_id = f.id and private.shuttlekaos_is_active(s.status, s.updated_at)
      )
    ) order by f.prefix desc, lower(f.name), f.id), '[]'::json)
    from found f
  );
end;
$$;

create function public.my_shuttlekaos_findable()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_findable boolean;
begin
  if auth.uid() is null then
    raise exception 'Log in first' using errcode = '42501';
  end if;
  select p.shuttlekaos_findable into v_findable from public.profiles p where p.id = auth.uid();
  return coalesce(v_findable, true);
end;
$$;

create function public.set_shuttlekaos_findable(p_findable boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Log in first' using errcode = '42501';
  end if;
  if p_findable is null then
    raise exception 'Choose yes or no' using errcode = '22023';
  end if;
  update public.profiles set shuttlekaos_findable = p_findable where id = auth.uid();
end;
$$;

revoke all on function private.shuttlekaos_idle_limit() from public, anon, authenticated;
revoke all on function private.shuttlekaos_is_active(text, timestamptz) from public, anon, authenticated;
revoke all on function private.shuttlekaos_iso(timestamptz) from public, anon, authenticated;
revoke all on function private.shuttlekaos_settled(jsonb, text, timestamptz) from public, anon, authenticated;
revoke all on function private.shuttlekaos_share_code() from public, anon, authenticated;
revoke all on function private.shuttlekaos_hide_accounts(jsonb) from public, anon, authenticated;
revoke all on function public.shuttlekaos_write(uuid, jsonb, int, uuid[], jsonb) from public, anon, authenticated;
revoke all on function public.shuttlekaos_session(text) from public;
revoke all on function public.public_shuttlekaos_sessions(text[]) from public;
revoke all on function public.my_shuttlekaos_sessions() from public, anon;
revoke all on function public.search_shuttlekaos_accounts(text) from public, anon;
revoke all on function public.my_shuttlekaos_findable() from public, anon;
revoke all on function public.set_shuttlekaos_findable(boolean) from public, anon;
grant execute on function public.shuttlekaos_write(uuid, jsonb, int, uuid[], jsonb) to service_role;
grant execute on function public.shuttlekaos_session(text) to anon, authenticated;
grant execute on function public.public_shuttlekaos_sessions(text[]) to anon, authenticated;
grant execute on function public.my_shuttlekaos_sessions() to authenticated;
grant execute on function public.search_shuttlekaos_accounts(text) to authenticated;
grant execute on function public.my_shuttlekaos_findable() to authenticated;
grant execute on function public.set_shuttlekaos_findable(boolean) to authenticated;

commit;
