import dayjs from 'dayjs';
import { z } from 'zod';

import { SITE_URL, type IcsEvent } from '../../../src/cms/ics.ts';
import { EventKind } from '../../../src/data/eventKinds.ts';
import { withLocale, type Locale } from '../../../src/i18n/locales.ts';
import { localized, opt, parseList, sanityQuery, Time, Venue } from './sanity.ts';

const QUERY = `{
  "home": *[_id == "clubDetails"][0].venue { name, address },
  "events": *[_type == "event" && !(kind in ["training", "break"]) && dateConfirmed != false
    && defined(slug.current) && coalesce(endDate, startDate) >= $since] | order(startDate asc) {
    "id": _id, kind, "slug": slug.current, startDate, endDate, startTime, endTime, venue,
    "title": ${localized('title')},
    "description": ${localized('description')}
  }
}`;

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
  venue: opt(Venue).catch(undefined),
});
type FeedEvent = z.infer<typeof FeedEvent>;

const Feed = z.object({ home: opt(Venue).catch(undefined), events: z.array(z.unknown()) });

const eventUrl = (slug: string, lang: Locale) => `${SITE_URL}${withLocale(`/arrangementer/${slug}`, lang)}`;

const toIcs = ({ kind, slug, venue, ...event }: FeedEvent, lang: Locale, home: Venue | undefined): IcsEvent => ({
  ...event,
  venue: venue ?? (kind === EventKind.enum.trip ? undefined : home),
  url: eventUrl(slug, lang),
});

export const fetchEvents = async (lang: Locale) => {
  const since = dayjs().subtract(12, 'month').format('YYYY-MM-DD');
  const { home, events } = Feed.parse(await sanityQuery(QUERY, lang, { since }));
  return parseList('event', FeedEvent, events).map((event) => toIcs(event, lang, home));
};
