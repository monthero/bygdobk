begin;

create or replace function public.my_shuttlekaos_stats()
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
      select m.id, m.share_code, m.title, m.data, m.started, m.my_id, side.ids, side.n - 1 = w.winner as won,
        side.n - 1 as my_side, w.winner, rd_n, mt_n, mt -> 'games' as games
      from mine m
      cross join jsonb_array_elements(m.data -> 'rounds') with ordinality as rds(rd, rd_n)
      cross join jsonb_array_elements(rd -> 'matches') with ordinality as mts(mt, mt_n)
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
    recent as (
      select ms.share_code, ms.title, ms.started, ms.id, ms.rd_n, ms.mt_n,
        case when ms.winner = -1 then 'drawn' when ms.won then 'won' else 'lost' end as result,
        (select coalesce(sum((g ->> ms.my_side::int)::int), 0) from jsonb_array_elements(ms.games) as g) as points_for,
        (select coalesce(sum((g ->> (1 - ms.my_side)::int)::int), 0) from jsonb_array_elements(ms.games) as g) as points_against
      from my_sides ms
      order by ms.started desc, ms.id desc, ms.rd_n desc, ms.mt_n desc
      limit 10
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
      'recentMatches', coalesce((
        select json_agg(json_build_object(
          'shareCode', rc.share_code,
          'title', rc.title,
          'round', rc.rd_n,
          'result', rc.result,
          'pointsFor', rc.points_for,
          'pointsAgainst', rc.points_against
        ) order by rc.started, rc.id, rc.rd_n, rc.mt_n)
        from recent rc
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

commit;
