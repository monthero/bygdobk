begin;

create table public.shuttlekaos_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.shuttlekaos_sessions (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index shuttlekaos_messages_session_idx on public.shuttlekaos_messages (session_id, created_at);
create index shuttlekaos_messages_profile_idx on public.shuttlekaos_messages (profile_id, created_at);

alter table public.shuttlekaos_messages enable row level security;

create function private.shuttlekaos_chat_ended_at(p_session public.shuttlekaos_sessions)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case
    when private.shuttlekaos_is_active(p_session) then null
    else coalesce(p_session.finished_at, p_session.updated_at)
  end;
$$;

create function private.shuttlekaos_chat_session(p_code text, p_uid uuid)
returns public.shuttlekaos_sessions
language plpgsql
stable
set search_path = ''
as $$
declare
  v_session public.shuttlekaos_sessions;
begin
  if p_uid is null then
    raise exception 'Log in to chat' using errcode = '42501';
  end if;
  select * into v_session from public.shuttlekaos_sessions where share_code = lower(trim(p_code));
  if not found then
    raise exception 'No such session' using errcode = 'P0002';
  end if;
  if v_session.owner_id <> p_uid and not exists (
    select 1 from public.shuttlekaos_players sp where sp.session_id = v_session.id and sp.profile_id = p_uid
  ) then
    raise exception 'Only players and the organizer can chat' using errcode = 'SKNOA';
  end if;
  return v_session;
end;
$$;

create function public.shuttlekaos_messages(p_code text)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_session public.shuttlekaos_sessions := private.shuttlekaos_chat_session(p_code, v_uid);
begin
  return coalesce((
    select json_agg(json_build_object(
      'id', m.id,
      'profileId', m.profile_id,
      'name', coalesce(pl ->> 'name', p.name),
      'avatarUrl', coalesce(p.avatar_url, pl ->> 'avatarUrl'),
      'body', m.body,
      'createdAt', private.shuttlekaos_iso(m.created_at),
      'mine', m.profile_id = v_uid,
      'canDelete', m.profile_id = v_uid or v_session.owner_id = v_uid
    ) order by m.created_at, m.id)
    from (
      select * from public.shuttlekaos_messages
      where session_id = v_session.id
      order by created_at desc, id desc
      limit 200
    ) m
    join public.profiles p on p.id = m.profile_id
    left join lateral (
      select pl from jsonb_array_elements(v_session.data -> 'players') as pl
      where lower(pl ->> 'profileId') = m.profile_id::text
      limit 1
    ) as players on true
  ), '[]'::json);
end;
$$;

create function public.send_shuttlekaos_message(p_code text, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  burst constant int := 10;
  v_uid uuid := auth.uid();
  v_session public.shuttlekaos_sessions := private.shuttlekaos_chat_session(p_code, v_uid);
  v_body text := trim(p_body);
  v_ended timestamptz := private.shuttlekaos_chat_ended_at(v_session);
begin
  if v_body is null or char_length(v_body) not between 1 and 500 then
    raise exception 'Invalid message' using errcode = '22023';
  end if;
  if v_ended is not null and v_ended < now() - interval '7 days' then
    raise exception 'This chat is closed' using errcode = 'SKNOA';
  end if;
  if (select count(*) from public.shuttlekaos_messages
      where profile_id = v_uid and created_at > now() - interval '30 seconds') >= burst then
    raise exception 'Too many messages' using errcode = 'PT429';
  end if;
  insert into public.shuttlekaos_messages (session_id, profile_id, body) values (v_session.id, v_uid, v_body);
end;
$$;

create function public.delete_shuttlekaos_message(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Log in to chat' using errcode = '42501';
  end if;
  delete from public.shuttlekaos_messages m
  using public.shuttlekaos_sessions s
  where m.id = p_id and s.id = m.session_id and (m.profile_id = v_uid or s.owner_id = v_uid);
  if not found then
    raise exception 'Not your message' using errcode = 'SKNOA';
  end if;
end;
$$;

create function private.shuttlekaos_chat_nudge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    '{"chat": true}'::jsonb,
    'changed',
    'shuttlekaos:' || (select share_code from public.shuttlekaos_sessions where id = coalesce(new.session_id, old.session_id)),
    false
  );
  return null;
end;
$$;

create trigger shuttlekaos_messages_nudge
after insert or delete on public.shuttlekaos_messages
for each row execute function private.shuttlekaos_chat_nudge();

create function private.shuttlekaos_clear_old_chats()
returns void
language sql
set search_path = ''
as $$
  delete from public.shuttlekaos_messages m
  using public.shuttlekaos_sessions s
  where s.id = m.session_id
    and private.shuttlekaos_chat_ended_at(s) < now() - interval '7 days';
$$;

select cron.schedule('shuttlekaos-clear-old-chats', '30 3 * * *', $$select private.shuttlekaos_clear_old_chats()$$);

revoke all on table public.shuttlekaos_messages from public, anon, authenticated;
revoke all on function private.shuttlekaos_chat_ended_at(public.shuttlekaos_sessions) from public, anon, authenticated;
revoke all on function private.shuttlekaos_chat_session(text, uuid) from public, anon, authenticated;
revoke all on function private.shuttlekaos_chat_nudge() from public, anon, authenticated;
revoke all on function private.shuttlekaos_clear_old_chats() from public, anon, authenticated;
revoke all on function public.shuttlekaos_messages(text) from public, anon;
revoke all on function public.send_shuttlekaos_message(text, text) from public, anon;
revoke all on function public.delete_shuttlekaos_message(uuid) from public, anon;
grant execute on function public.shuttlekaos_messages(text) to authenticated;
grant execute on function public.send_shuttlekaos_message(text, text) to authenticated;
grant execute on function public.delete_shuttlekaos_message(uuid) to authenticated;

commit;
