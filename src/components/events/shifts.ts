import type { Shift } from '~/cms/calendar';
import { Team } from '~/data/events';
import { date } from '~/utils/dates';

export const TEAM_COLORS: Record<Team, string> = {
  [Team.enum.hall]: 'blue',
  [Team.enum.kiosk]: 'orange',
  [Team.enum.secretariat]: 'grape',
};

export const shiftDays = (shifts: readonly Shift[]) =>
  [...new Set(shifts.values().map((s) => s.day))].sort((a, b) => date(a).valueOf() - date(b).valueOf());

export const peopleNeeded = (shifts: readonly Shift[]) => shifts.reduce((sum, s) => sum + s.spots, 0);

export const spotsTaken = (shifts: readonly Shift[], counts: ReadonlyMap<string, number>) =>
  shifts.reduce((sum, s) => sum + Math.min(counts.get(s._key) ?? 0, s.spots), 0);

export const shiftTime = (shift: Pick<Shift, 'start' | 'end'>) =>
  shift.end ? `${shift.start}–${shift.end}` : shift.start;
