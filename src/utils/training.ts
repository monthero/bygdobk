import {
  affects,
  eventDays,
  isTraining,
  occurrences,
  seasonOf,
  seasonOn,
  trainingSeasons,
  type CalendarEvent,
  type Season,
} from '~/cms/calendar';
import { seasonAround, trainingSessions, type PlannedSession as SchedulePlannedSession } from '~/cms/schedule';
import { Group } from '~/data/club';
import { EventKind } from '~/data/events';

import { date, minutesOf, today, wallNow, type Dayjs } from './dates';

type Venue = NonNullable<CalendarEvent['venue']>;

export type Session = { weekday: number; group: Group; start: string; end: string; venue?: Venue };

export type PlannedSession = SchedulePlannedSession<CalendarEvent>;

type TrainingDay = { day: Dayjs; sessions: PlannedSession[] };

const NEXT_TRAINING_DAYS = 14;
const RESUME_SEARCH_DAYS = 28;

const groupOrder = (a: Group, b: Group) => Group.options.indexOf(a) - Group.options.indexOf(b);

export const seasonList = (events: readonly CalendarEvent[], day = today()) => {
  const seasons = trainingSeasons(events);
  return seasons.length > 0 ? seasons : [seasonAround(day)];
};

export const currentSeason = (seasons: readonly Season[], day = today()) =>
  seasonOn(seasons, day) ?? seasons.findLast((s) => s.start.isAfter(day, 'day')) ?? seasons.at(0) ?? seasonAround(day);

export const seasonTraining = (events: readonly CalendarEvent[], season: Pick<Season, 'id'>) =>
  events.filter((e) => isTraining(e) && seasonOf(date(e.startDate)).id === season.id);

export const weeklySessions = (training: readonly CalendarEvent[]): Session[] => {
  const sessions = new Map<string, Session>();
  for (const { group, startTime, endTime, recurrence, venue } of training) {
    if (!group || !startTime || !endTime || !recurrence) continue;
    for (const weekday of recurrence.weekdays) {
      sessions.set(`${weekday}-${group}-${startTime}-${endTime}-${venue?.name ?? ''}`, {
        weekday,
        group,
        start: startTime,
        end: endTime,
        venue,
      });
    }
  }
  return Array.from(sessions.values()).sort(
    (a, b) => a.weekday - b.weekday || minutesOf(a.start) - minutesOf(b.start) || groupOrder(a.group, b.group),
  );
};

export const plannedSessions = (
  events: readonly CalendarEvent[],
  from: Dayjs,
  to: Dayjs,
  group?: Group,
): PlannedSession[] =>
  [...trainingSessions(events, from, to, group)].sort(
    (a, b) => a.start.valueOf() - b.start.valueOf() || groupOrder(a.group, b.group),
  );

export const nextTrainingDay = (
  events: readonly CalendarEvent[],
  group?: Group,
  now: Dayjs = wallNow(),
): TrainingDay | undefined => {
  const upcoming = plannedSessions(events, now, now.add(NEXT_TRAINING_DAYS - 1, 'day'), group).filter((s) =>
    s.end.isAfter(now),
  );
  const first = upcoming.at(0);
  if (!first) return undefined;
  return { day: first.day, sessions: upcoming.filter((s) => s.day.isSame(first.day, 'day')) };
};

export const isLive = (session: PlannedSession, now: Dayjs = wallNow()) =>
  !session.off && !session.start.isAfter(now) && now.isBefore(session.end);

export const offTitles = (sessions: readonly PlannedSession[]) =>
  Array.from(new Set(sessions.values().flatMap((s) => (s.off?.title ? [s.off.title] : []))));

const happensBetween = (event: CalendarEvent, from: Dayjs, to: Dayjs) => !occurrences(event, from, to).next().done;

export const trainingBreaks = (events: readonly CalendarEvent[], from: Dayjs, to: Dayjs) => {
  const replacing = new Set(
    plannedSessions(events, from, to)
      .values()
      .flatMap((s) => (s.off ? [s.off.id] : [])),
  );
  return events.filter(
    (e) => replacing.has(e.id) || (e.kind === EventKind.enum.break && happensBetween(e, from.startOf('day'), to)),
  );
};

export const trainingResumes = (event: CalendarEvent, events: readonly CalendarEvent[]) => {
  const from = eventDays(event).last.add(1, 'day');
  return plannedSessions(events, from, from.add(RESUME_SEARCH_DAYS - 1, 'day')).find(
    (s) => !s.off && affects(event, s.group),
  )?.day;
};
