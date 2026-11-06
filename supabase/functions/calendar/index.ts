import dayjs from 'dayjs';
import { z } from 'npm:zod@4';

import { calendarFile, SITE_URL, type IcsEvent } from '../../../src/cms/ics.ts';
import { CONTENT_FALLBACK, DEFAULT_LOCALE, LOCALES, type Locale } from '../../../src/i18n/locales.ts';

const SANITY_QUERY_URL = 'https://psw4r05b.apicdn.sanity.io/v2026-11-01/data/query/production';
const CALENDAR_NAME = 'Bygdø Badmintonklubb';
const CACHE_SECONDS = 15 * 60;
const TRIP_KIND = 'trip';

// Keep in sync with CLUB in src/data/club.ts.
const HOME_VENUE = { name: 'Bygdøhus', address: 'Huk Aveny 45, 0287 Oslo' };

const Lang = z.enum(LOCALES).catch(DEFAULT_LOCALE);

const localized = (field: string) => {
  const own = [`${field}[$lang]`, `${field}[$fallback]`].map((value) => `select(${value} != "" => ${value})`);
  return `coalesce(${own.join(', ')}, ${field}.nb)`;
};

const QUERY = `*[_type == "event" && !(kind in ["training", "break"]) && dateConfirmed != false
  && defined(slug.current) && coalesce(endDate, startDate) >= $since] | order(startDate asc) {
  "id": _id, kind, "slug": slug.current, startDate, endDate, startTime, endTime, venue,
  "title": ${localized('title')},
  "description": ${localized('description')}
}`;

const opt = <T extends z.ZodType>(schema: T) => schema.nullish().transform((v) => v ?? undefined);

const Time = z.string().regex(/^\d{2}:\d{2}$/);

const FeedEvent = z.object({
  id: z.string().min(1),
  kind: z.string(),
  slug: z.string().min(1),
  title: z.string().min(1),
  startDate: z.iso.date(),
  endDate: opt(z.iso.date()),
  startTime: opt(Time),
  endTime: opt(Time),
  description: opt(z.string()),
  venue: opt(z.object({ name: z.string().min(1), address: opt(z.string()) })).catch(undefined),
});
type FeedEvent = z.infer<typeof FeedEvent>;

const Feed = z.object({ result: z.array(z.unknown()) });

const eventUrl = (slug: string, lang: Locale) =>
  `${SITE_URL}${lang === DEFAULT_LOCALE ? '' : `/${lang}`}/arrangementer/${slug}`;

const toIcs = ({ kind, slug, venue, ...event }: FeedEvent, lang: Locale): IcsEvent => ({
  ...event,
  venue: venue ?? (kind === TRIP_KIND ? undefined : HOME_VENUE),
  url: eventUrl(slug, lang),
});

const fetchEvents = async (lang: Locale) => {
  const url = new URL(SANITY_QUERY_URL);
  url.searchParams.set('query', QUERY);
  url.searchParams.set('$lang', JSON.stringify(lang));
  url.searchParams.set('$fallback', JSON.stringify(CONTENT_FALLBACK[lang]));
  url.searchParams.set('$since', JSON.stringify(dayjs().subtract(12, 'month').format('YYYY-MM-DD')));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity responded ${res.status}: ${await res.text()}`);
  return Feed.parse(await res.json()).result.flatMap((raw) => {
    const parsed = FeedEvent.safeParse(raw);
    if (parsed.success) return [toIcs(parsed.data, lang)];
    console.warn('Skipped an invalid event', z.prettifyError(parsed.error));
    return [];
  });
};

export default {
  fetch: async (req: Request) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });

    const lang = Lang.parse(new URL(req.url).searchParams.get('lang'));
    try {
      return new Response(calendarFile(await fetchEvents(lang), CALENDAR_NAME), {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'inline; filename="kalender.ics"',
          'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
        },
      });
    } catch (error) {
      console.error('Building the calendar failed', error);
      return new Response('Could not load the calendar', { status: 502 });
    }
  },
};
