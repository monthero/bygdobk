begin;

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'shuttlekaos-fill-series',
  '15 3 * * *',
  $$select private.shuttlekaos_fill_series(id) from public.shuttlekaos_series where ended_at is null$$
);

commit;
