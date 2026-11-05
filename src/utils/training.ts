import type { I18n, MessageDescriptor } from '@lingui/core';
import { z } from 'zod';

import { CLOSURES, CURRENT_SEASON, SEASONS, type Group, type Season, type Session } from '~/data/club';
import type { EditedClosure } from '~/stores/content';

import { date, dayjs, ISO_DAY, minutesOf, type Dayjs } from './dates';

export const ClosureSource = z.enum(['site', 'edited']);
export type ClosureSource = z.infer<typeof ClosureSource>;

export type TrainingClosure = {
  id: string;
  from: string;
  to: string;
  reason: MessageDescriptor | string;
  source: ClosureSource;
};

const SITE_CLOSURES: TrainingClosure[] = CLOSURES.map((c) => ({ ...c, source: ClosureSource.enum.site }));

const RESUME_SEARCH_DAYS = 28;

export const toTrainingClosure = (c: EditedClosure): TrainingClosure => ({ ...c, source: ClosureSource.enum.edited });

export const mergeClosures = (edited: readonly EditedClosure[]): TrainingClosure[] =>
  [...SITE_CLOSURES, ...edited.map(toTrainingClosure)].sort((a, b) => a.from.localeCompare(b.from));

export const closureReason = (i18n: I18n, closure: TrainingClosure) =>
  typeof closure.reason === 'string' ? closure.reason : i18n._(closure.reason);

export const closureOn = (day: Dayjs, closures: readonly TrainingClosure[]): TrainingClosure | undefined => {
  const iso = day.format(ISO_DAY);
  return closures.find((c) => c.from <= iso && iso <= c.to);
};

export const closuresInSeason = (closures: readonly TrainingClosure[], season: Season) =>
  closures.filter((c) => c.to >= season.start && c.from <= season.end);

export const upcomingClosures = (closures: readonly TrainingClosure[], weeks: number, now: Dayjs = dayjs()) => {
  const from = now.format(ISO_DAY);
  const until = now.add(weeks, 'week').format(ISO_DAY);
  return closures.filter((c) => c.to >= from && c.from <= until);
};

const seasonOn = (iso: string) => SEASONS.find((s) => s.start <= iso && iso <= s.end);

export const trainingResumes = (closure: TrainingClosure, closures: readonly TrainingClosure[]) => {
  const first = date(closure.to).add(1, 'day');
  for (let offset = 0; offset < RESUME_SEARCH_DAYS; offset++) {
    const day = first.add(offset, 'day');
    const trains = seasonOn(day.format(ISO_DAY))?.schedule.some((s) => s.weekday === day.isoWeekday());
    if (trains && !closureOn(day, closures)) return day;
  }
  return undefined;
};

export type UpcomingDay = { day: Dayjs; sessions: Session[]; closure?: TrainingClosure };

export const nextTrainingDay = (
  closures: readonly TrainingClosure[],
  group?: Group,
  now: Dayjs = dayjs(),
): UpcomingDay | undefined => {
  const nowMinutes = now.hour() * 60 + now.minute();
  for (let offset = 0; offset < 14; offset++) {
    const day = now.startOf('day').add(offset, 'day');
    const sessions = CURRENT_SEASON.schedule.filter(
      (s) =>
        (!group || s.group === group) &&
        s.weekday === day.isoWeekday() &&
        (offset > 0 || minutesOf(s.end) > nowMinutes),
    );
    if (sessions.length) return { day, sessions, closure: closureOn(day, closures) };
  }
  return undefined;
};

export const isLive = (session: Session, now: Dayjs = dayjs()) => {
  const minutes = now.hour() * 60 + now.minute();
  return (
    session.weekday === now.isoWeekday() && minutesOf(session.start) <= minutes && minutes < minutesOf(session.end)
  );
};
