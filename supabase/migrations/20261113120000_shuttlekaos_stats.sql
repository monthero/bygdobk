-- Mirrors matchWinner in src/shuttlekaos/engine/scores.ts: winning side 0 or 1, -1 for a draw, null for an invalid score.
create function private.shuttlekaos_match_winner(p_settings jsonb, p_games jsonb)
returns int
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_points int := (p_settings ->> 'points')::int;
  v_needed int := case when p_settings ->> 'sets' = '3' then 2 else 1 end;
  v_home int;
  v_away int;
  v_home_wins int := 0;
  v_away_wins int := 0;
  v_game jsonb;
begin
  if jsonb_typeof(p_games) is distinct from 'array' then
    return null;
  end if;

  if p_settings ->> 'scoreMode' = 'total' then
    if jsonb_array_length(p_games) <> 1 then
      return null;
    end if;
    v_home := (p_games -> 0 ->> 0)::int;
    v_away := (p_games -> 0 ->> 1)::int;
    if v_home + v_away <> v_points then
      return null;
    end if;
    return case when v_home > v_away then 0 when v_away > v_home then 1 else -1 end;
  end if;

  for v_game in select g from jsonb_array_elements(p_games) with ordinality as t(g, n) order by n loop
    if greatest(v_home_wins, v_away_wins) = v_needed then
      return null;
    end if;
    v_home := (v_game ->> 0)::int;
    v_away := (v_game ->> 1)::int;
    if v_home > v_points or v_away > v_points
      or (v_home = v_points and v_away = v_points)
      or (v_home <> v_points and v_away <> v_points) then
      return null;
    end if;
    if v_home > v_away then
      v_home_wins := v_home_wins + 1;
    else
      v_away_wins := v_away_wins + 1;
    end if;
  end loop;

  if greatest(v_home_wins, v_away_wins) <> v_needed then
    return null;
  end if;
  return case when v_home_wins > v_away_wins then 0 else 1 end;
end;
$$;

create function public.my_shuttlekaos_stats()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Log in to see your stats' using errcode = '42501';
  end if;

  return (
    with mine as (
      select s.id, s.share_code, s.title, s.data, coalesce(s.started_at, s.created_at) as started, r.*,
        case
          when s.data -> 'settings' ->> 'style' = 'doubles' and s.data -> 'settings' ->> 'partners' = 'fixed'
            then jsonb_array_length(s.data -> 'pairs')
          else jsonb_array_length(s.data -> 'players')
        end as entrants,
        (
          select pl ->> 'id'
          from jsonb_array_elements(s.data -> 'players') as pl
          where lower(pl ->> 'profileId') = v_uid::text
          limit 1
        ) as my_id
      from public.shuttlekaos_results r
      join public.shuttlekaos_sessions s on s.id = r.session_id
      where r.profile_id = v_uid
        and not private.shuttlekaos_is_active(s.status, s.updated_at)
    ),
    my_sides as (
      select m.data, m.started, m.my_id, side.ids, side.n - 1 = w.winner as won
      from mine m
      cross join jsonb_array_elements(m.data -> 'rounds') as rd
      cross join jsonb_array_elements(rd -> 'matches') as mt
      cross join jsonb_array_elements(mt -> 'sides') with ordinality as side(ids, n)
      cross join lateral (select private.shuttlekaos_match_winner(m.data -> 'settings', mt -> 'games') as winner) as w
      where m.my_id is not null and side.ids ? m.my_id and w.winner is not null
    ),
    teammates as (
      select ms.started, ms.won, pl,
        coalesce('id:' || lower(pl ->> 'profileId'), 'name:' || lower(trim(pl ->> 'name'))) as partner_key
      from my_sides ms
      cross join jsonb_array_elements_text(ms.ids) as partner_id
      join lateral jsonb_array_elements(ms.data -> 'players') as pl on pl ->> 'id' = partner_id
      where partner_id <> ms.my_id
    ),
    partners as (
      select t.partner_key,
        count(*) as played,
        count(*) filter (where t.won) as won,
        (array_agg(t.pl order by t.started desc))[1] as latest
      from teammates t
      group by t.partner_key
      order by count(*) desc, count(*) filter (where t.won) desc, t.partner_key
      limit 5
    ),
    shown_partners as (
      select p.played, p.won,
        coalesce(pr.name, p.latest ->> 'name') as name,
        pr.id as profile_id,
        coalesce(pr.avatar_url, p.latest ->> 'avatarUrl') as avatar_url
      from partners p
      left join public.profiles pr
        on p.latest ->> 'profileId' is not null and pr.id::text = lower(p.latest ->> 'profileId')
    ),
    form as (
      select m.*
      from mine m
      order by m.started desc, m.id
      limit 30
    )
    select json_build_object(
      'totals', (
        select json_build_object(
          'sessions', count(*),
          'played', coalesce(sum(m.played), 0),
          'won', coalesce(sum(m.won), 0),
          'lost', coalesce(sum(m.lost), 0),
          'drawn', coalesce(sum(m.drawn), 0),
          'pointsFor', coalesce(sum(m.points_for), 0),
          'pointsAgainst', coalesce(sum(m.points_against), 0),
          'averagePlace', round(avg(m.rank), 1),
          'bestPlace', min(m.rank),
          'wins', count(*) filter (where m.rank = 1),
          'podiums', count(*) filter (where m.rank <= 3)
        )
        from mine m
      ),
      'form', coalesce((
        select json_agg(json_build_object(
          'shareCode', f.share_code,
          'title', f.title,
          'startedAt', private.shuttlekaos_iso(f.started),
          'rank', f.rank,
          'entrants', f.entrants,
          'played', f.played,
          'won', f.won,
          'pointsFor', f.points_for,
          'pointsAgainst', f.points_against
        ) order by f.started, f.id)
        from form f
      ), '[]'::json),
      'partners', coalesce((
        select json_agg(json_build_object(
          'name', sp.name,
          'profileId', sp.profile_id,
          'avatarUrl', sp.avatar_url,
          'played', sp.played,
          'won', sp.won
        ) order by sp.played desc, sp.won desc, lower(sp.name))
        from shown_partners sp
      ), '[]'::json)
    )
  );
end;
$$;

revoke all on function private.shuttlekaos_match_winner(jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.my_shuttlekaos_stats() from public, anon;
grant execute on function public.my_shuttlekaos_stats() to authenticated;
