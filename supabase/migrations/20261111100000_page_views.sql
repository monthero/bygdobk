create type public.visit_device as enum ('phone', 'tablet', 'computer');

create table public.page_views (
  day date not null,
  path text not null check (char_length(path) between 1 and 200),
  language text not null check (language in ('nb', 'en', 'sv', 'da', 'fi', 'is', 'zh')),
  referrer_host text not null default '' check (char_length(referrer_host) <= 253),
  device public.visit_device not null,
  views integer not null default 1 check (views > 0),
  primary key (day, path, language, referrer_host, device)
);

alter table public.page_views enable row level security;

revoke all on table public.page_views from anon, authenticated;

create function public.record_page_view(
  p_path text,
  p_language text,
  p_device public.visit_device,
  p_referrer_host text default ''
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'Europe/Oslo')::date;
  v_host text := lower(trim(coalesce(p_referrer_host, '')));
begin
  if p_path is null or char_length(p_path) > 200 or p_path !~ '^/[A-Za-z0-9._~%/-]*$'
    or p_language is null or p_language not in ('nb', 'en', 'sv', 'da', 'fi', 'is', 'zh')
    or p_device is null then
    raise exception 'Invalid page view' using errcode = '22023';
  end if;
  if v_host like 'www.%' then
    v_host := substr(v_host, 5);
  end if;
  if char_length(v_host) > 253
    or v_host !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$'
    or v_host in ('bygdobk.no', 'bygdobk.vercel.app')
    or v_host like 'bygdobk-%.vercel.app' then
    v_host := '';
  end if;

  update public.page_views
  set views = views + 1
  where day = v_day and path = p_path and language = p_language and referrer_host = v_host and device = p_device;
  if found then
    return;
  end if;
  -- Made-up paths can only add this many new rows a day.
  if (select count(*) from public.page_views where day = v_day) >= 5000 then
    return;
  end if;
  insert into public.page_views (day, path, language, referrer_host, device)
  values (v_day, p_path, p_language, v_host, p_device)
  on conflict (day, path, language, referrer_host, device) do update set views = public.page_views.views + 1;
end;
$$;

create function public.board_visits(p_from date, p_to date)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Only admins can see visitor numbers' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 400 then
    raise exception 'Invalid period' using errcode = '22023';
  end if;
  return (
    with v as (
      select * from public.page_views where day between p_from and p_to
    ),
    by_day as (
      select day, sum(views)::int as views from v group by day
    ),
    by_path as (
      select path, sum(views)::int as views from v group by path order by views desc, path limit 15
    ),
    by_host as (
      select referrer_host as host, sum(views)::int as views
      from v where referrer_host <> ''
      group by referrer_host order by views desc, host limit 10
    ),
    by_device as (
      select device, sum(views)::int as views from v group by device
    ),
    by_language as (
      select language, sum(views)::int as views from v group by language
    )
    select json_build_object(
      'views', (select coalesce(sum(views), 0)::int from v),
      'fromOtherSites', (select coalesce(sum(views), 0)::int from v where referrer_host <> ''),
      'days', (select coalesce(json_agg(json_build_object('day', day, 'views', views) order by day), '[]') from by_day),
      'pages', (select coalesce(json_agg(json_build_object('path', path, 'views', views) order by views desc, path), '[]') from by_path),
      'referrers', (select coalesce(json_agg(json_build_object('host', host, 'views', views) order by views desc, host), '[]') from by_host),
      'devices', (select coalesce(json_agg(json_build_object('device', device, 'views', views) order by views desc), '[]') from by_device),
      'languages', (select coalesce(json_agg(json_build_object('language', language, 'views', views) order by views desc), '[]') from by_language)
    )
  );
end;
$$;

revoke all on function public.record_page_view(text, text, public.visit_device, text) from public;
revoke all on function public.board_visits(date, date) from public, anon;
grant execute on function public.record_page_view(text, text, public.visit_device, text) to anon, authenticated;
grant execute on function public.board_visits(date, date) to authenticated;
