import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';

import { EventKind } from '../data/eventKinds.ts';

dayjs.extend(utc);
dayjs.extend(isoWeek);

export type Schedulable = {
  kind: EventKind;
  group?: string;
  groups: readonly string[];
  startDate: string;
  endDate?: string;
  dateConfirmed: boolean;
  startTime?: string;
  endTime?: string;
  recurrence?: { weekdays: readonly number[]; until: string };
};

export type Occurrence<E extends Schedulable = Schedulable> = { event: E; day: Dayjs; start: Dayjs; end: Dayjs };

export type PlannedSession<E extends Schedulable = Schedulable> = Occurrence<E> & {
  group: NonNullable<E['group']>;
  off?: E;
};

export type Season = { id: string; label: string; start: Dayjs; end: Dayjs };

export const CLUB_TIME_ZONE = 'Europe/Oslo';

const JULY = 6;

export const date = (iso: string) => dayjs.utc(iso);

export const minutesOf = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};

export const isTraining = (event: Pick<Schedulable, 'kind'>) => event.kind === EventKind.enum.training;

const lastDay = (event: Schedulable) => date(event.recurrence?.until ?? event.endDate ?? event.startDate);

export const eventDays = (event: Schedulable) => ({ first: date(event.startDate), last: lastDay(event) });

export const isPast = (event: Schedulable, day: Dayjs) => lastDay(event).isBefore(day, 'day');

export const isOngoing = (event: Schedulable, day: Dayjs) =>
  event.dateConfirmed && !date(event.startDate).isAfter(day, 'day') && !isPast(event, day);

const at = (day: Dayjs, time: string | undefined, fallback: Dayjs) =>
  time ? day.add(minutesOf(time), 'minute') : fallback;

const occurrenceOn = <E extends Schedulable>(event: E, day: Dayjs, endDay: Dayjs): Occurrence<E> => ({
  event,
  day,
  start: at(day, event.startTime, day),
  end: at(endDay, event.endTime, endDay.add(1, 'day')),
});

export function* occurrences<E extends Schedulable>(event: E, from: Dayjs, to: Dayjs): Generator<Occurrence<E>> {
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

export const affects = (event: Schedulable, group: string | undefined) =>
  event.groups.length === 0 || (group !== undefined && event.groups.includes(group));

const overlaps = (a: Occurrence, b: Occurrence) => a.start.isBefore(b.end) && b.start.isBefore(a.end);

export const replacedBy = <E extends Schedulable>(session: Occurrence, events: readonly E[]) => {
  for (const event of events) {
    if (isTraining(event) || !affects(event, session.event.group)) continue;
    for (const other of occurrences(event, session.day, session.day)) {
      if (overlaps(session, other)) return event;
    }
  }
  return undefined;
};

export function* trainingSessions<E extends Schedulable>(
  events: readonly E[],
  from: Dayjs,
  to: Dayjs,
  group?: string,
): Generator<PlannedSession<E>> {
  for (const event of events) {
    const own: E['group'] = event.group;
    if (!isTraining(event) || !own || (group && own !== group)) continue;
    for (const occurrence of occurrences(event, from.startOf('day'), to)) {
      yield { ...occurrence, group: own, off: replacedBy(occurrence, events) };
    }
  }
}

export const seasonOf = (day: Dayjs): Pick<Season, 'id' | 'label'> => {
  const year = day.month() >= JULY ? day.year() : day.year() - 1;
  const next = String(year + 1).slice(2);
  return { id: `${year}-${next}`, label: `${year}/${next}` };
};

export const seasonAround = (day: Dayjs): Season => {
  const { id, label } = seasonOf(day);
  const start = date(`${id.slice(0, 4)}-07-01`);
  return { id, label, start, end: start.add(1, 'year').subtract(1, 'day') };
};

export const trainingSeasons = (events: readonly Schedulable[]): Season[] => {
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
