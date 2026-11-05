import { Team, type Shift } from '~/data/events';
import { date } from '~/utils/dates';

export const TEAM_COLORS: Record<Team, string> = {
  [Team.enum.hall]: 'blue',
  [Team.enum.kiosk]: 'orange',
  [Team.enum.secretariat]: 'grape',
};

const DAY_SLUGS = ['sondag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lordag'];

export const daySlug = (iso: string) => DAY_SLUGS[date(iso).day()] ?? iso;

export const SAMPLE_TAKEN: Record<string, number> = {
  'hall-setup': 3,
  'kiosk-setup': 2,
  'kiosk-2026-10-31-08:30': 2,
  'secretariat-2026-10-31-08:00': 3,
  'hall-2026-11-01-12:00': 1,
};

export const takenSpots = (shift: Shift) => Math.min(SAMPLE_TAKEN[shift.id] ?? 0, shift.spots);

export const shiftTotals = (shifts: readonly Shift[]) =>
  shifts.reduce((sum, s) => ({ taken: sum.taken + takenSpots(s), spots: sum.spots + s.spots }), { taken: 0, spots: 0 });
