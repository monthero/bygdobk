import type { Group } from '~/data/club';
import { EventKind } from '~/data/events';
import { date, minutesOf, type Dayjs } from '~/utils/dates';

import type { SiteContent } from './content';

export type CalendarEvent = SiteContent['events'][number];

export type Shift = CalendarEvent['shifts'][number];

export type Occurrence = { event: CalendarEvent; day: Dayjs; start: Dayjs; end: Dayjs };

const JULY = 6;

export const isTraining = (event: CalendarEvent) => event.kind === EventKind.enum.training;

const lastDay = (event: CalendarEvent) => date(event.recurrence?.until ?? event.endDate ?? event.startDate);

export const eventDays = (event: CalendarEvent) => ({ first: date(event.startDate), last: lastDay(event) });

export const isPast = (event: CalendarEvent, day: Dayjs) => lastDay(event).isBefore(day, 'day');

export const isOngoing = (event: CalendarEvent, day: Dayjs) =>
  event.dateConfirmed && !date(event.startDate).isAfter(day, 'day') && !isPast(event, day);

const at = (day: Dayjs, time: string | undefined, fallback: Dayjs) =>
  time ? day.add(minutesOf(time), 'minute') : fallback;

const occurrenceOn = (event: CalendarEvent, day: Dayjs, endDay: Dayjs): Occurrence => ({
  event,
  day,
  start: at(day, event.startTime, day),
  end: at(endDay, event.endTime, endDay.add(1, 'day')),
});

export function* occurrences(event: CalendarEvent, from: Dayjs, to: Dayjs): Generator<Occurrence> {
  if (!event.dateConfirmed) return;
  const first = date(event.startDate);
  const last = lastDay(event);
  if (first.isAfter(to, 'day') || last.isBefore(from, 'day')) return;
  const { recurrence } = event;
  if (!recurrence) {
    yield occurrenceOn(event, first, last);
    return;
  }
  const weekdays = new Set(recurrence.weekdays);
  const until = last.isBefore(to, 'day') ? last : to;
  for (let day = first.isBefore(from, 'day') ? from : first; !day.isAfter(until, 'day'); day = day.add(1, 'day')) {
    if (weekdays.has(day.isoWeekday())) yield occurrenceOn(event, day, day);
  }
}

export const affects = (event: CalendarEvent, group: Group | undefined) =>
  event.groups.length === 0 || (group !== undefined && event.groups.includes(group));

const overlaps = (a: Occurrence, b: Occurrence) => a.start.isBefore(b.end) && b.start.isBefore(a.end);

export const replacedBy = (session: Occurrence, events: readonly CalendarEvent[]) => {
  for (const event of events) {
    if (isTraining(event) || !affects(event, session.event.group)) continue;
    for (const other of occurrences(event, session.day, session.day)) {
      if (overlaps(session, other)) return event;
    }
  }
  return undefined;
};

export type Season = { id: string; label: string; start: Dayjs; end: Dayjs };

export const seasonOf = (day: Dayjs): Pick<Season, 'id' | 'label'> => {
  const year = day.month() >= JULY ? day.year() : day.year() - 1;
  const next = String(year + 1).slice(2);
  return { id: `${year}-${next}`, label: `${year}/${next}` };
};

export const trainingSeasons = (events: readonly CalendarEvent[]): Season[] => {
  const seasons = new Map<string, Season>();
  for (const event of events) {
    if (!isTraining(event)) continue;
    const start = date(event.startDate);
    const end = lastDay(event);
    const { id, label } = seasonOf(start);
    const known = seasons.get(id);
    seasons.set(id, {
      id,
      label,
      start: known?.start.isBefore(start) ? known.start : start,
      end: known?.end.isAfter(end) ? known.end : end,
    });
  }
  return Array.from(seasons.values()).sort((a, b) => b.start.valueOf() - a.start.valueOf());
};

export const seasonOn = (seasons: readonly Season[], day: Dayjs) =>
  seasons.find((s) => !day.isBefore(s.start, 'day') && !day.isAfter(s.end, 'day'));
