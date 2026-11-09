import type { Dayjs } from 'dayjs';
import { z } from 'zod';

import { calendarFile, IcsStatus, SITE_URL, type IcsEvent } from '../../../src/cms/ics.ts';
import { date, seasonAround, trainingSessions } from '../../../src/cms/schedule.ts';
import { EventKind } from '../../../src/data/eventKinds.ts';
import { GROUP_SLUGS, type Group } from '../../../src/data/groupKeys.ts';
import { withLocale, type Locale } from '../../../src/i18n/locales.ts';
import { localized, opt, parseList, sanityQuery, Time, Venue } from './sanity.ts';

const CLUB_TIME_ZONE = 'Europe/Oslo';
const CLUB_NAME = 'Bygdø BK';
const REFRESH_EVERY = 'PT1H';

const WORDS: Record<Locale, { training: string; canceled: string }> = {
  nb: { training: 'Trening', canceled: 'Avlyst' },
  en: { training: 'Training', canceled: 'Canceled' },
  sv: { training: 'Träning', canceled: 'Inställd' },
  da: { training: 'Træning', canceled: 'Aflyst' },
  fi: { training: 'Harjoitukset', canceled: 'Peruttu' },
  is: { training: 'Æfing', canceled: 'Aflýst' },
  zh: { training: '训练', canceled: '已取消' },
};

const QUERY = `{
  "home": *[_id == "clubDetails"][0].venue { name, address },
  "group": *[_type == "trainingGroup" && key == $group][0] { "name": ${localized('name')} },
  "events": *[_type == "event" && startDate <= $to && coalesce(recurrence.until, endDate, startDate) >= $from
    && ((kind == "training" && group == $group) || (kind != "training" && (count(coalesce(groups, [])) == 0 || $group in groups)))] {
    "id": _id, kind, group, groups, startDate, endDate, dateConfirmed, startTime, endTime, recurrence, venue,
    "title": ${localized('title')}
  }
}`;

const IsoDay = z.iso.date();

const TrainingRow = z.object({
  id: z.string().min(1),
  kind: EventKind,
  group: opt(z.string()),
  groups: opt(z.array(z.string())).transform((g) => g ?? []),
  startDate: IsoDay,
  endDate: opt(IsoDay),
  dateConfirmed: z
    .boolean()
    .nullish()
    .transform((v) => v ?? true),
  startTime: opt(Time),
  endTime: opt(Time),
  recurrence: opt(z.object({ weekdays: z.array(z.number().int().min(1).max(7)).min(1), until: IsoDay })),
  venue: opt(Venue).catch(undefined),
  title: opt(z.string()),
});
type TrainingRow = z.infer<typeof TrainingRow>;

const Feed = z.object({
  home: opt(Venue).catch(undefined),
  group: opt(z.object({ name: opt(z.string()) })).catch(undefined),
  events: z.array(z.unknown()),
});

export type TrainingData = { home?: Venue; name?: string; events: TrainingRow[] };

const DAY_FORMAT = new Intl.DateTimeFormat('sv-SE', { timeZone: CLUB_TIME_ZONE });

export const clubToday = () => date(DAY_FORMAT.format(new Date()));

const lastFeedDay = (today: Dayjs) => seasonAround(today).end.add(1, 'year');

export const fetchTraining = async (group: Group, lang: Locale, today: Dayjs): Promise<TrainingData> => {
  const range = { group, from: today.format('YYYY-MM-DD'), to: lastFeedDay(today).format('YYYY-MM-DD') };
  const { home, group: info, events } = Feed.parse(await sanityQuery(QUERY, lang, range));
  return { home, name: info?.name, events: parseList('training event', TrainingRow, events) };
};

export const trainingCalendar = ({ home, name, events }: TrainingData, group: Group, lang: Locale, today: Dayjs) => {
  const words = WORDS[lang];
  const title = `${words.training}: ${name ?? group}`;
  const url = `${SITE_URL}${withLocale('/trening', lang)}?gruppe=${GROUP_SLUGS.toSlug(group)}`;
  const sessions = Array.from(
    trainingSessions(events, today, lastFeedDay(today), group),
    ({ event, day, off }): IcsEvent => ({
      id: `${event.id}-${day.format('YYYYMMDD')}`,
      title: off ? `${words.canceled} – ${title}` : title,
      startDate: day.format('YYYY-MM-DD'),
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue ?? home,
      description: off?.title,
      url,
      status: off ? IcsStatus.enum.CANCELLED : IcsStatus.enum.CONFIRMED,
    }),
  );
  return calendarFile(sessions, `${title} · ${CLUB_NAME}`, REFRESH_EVERY);
};
