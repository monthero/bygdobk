import { useMemo } from 'react';

import type { Shift } from '~/cms/calendar';
import { shiftDays } from '~/components/events';
import { Team } from '~/data/events';
import { minutesOf } from '~/utils/dates';
import type { AdminShiftVolunteer } from '~/volunteers/model';

export type TeamShifts = { team: Team; shifts: Shift[] };
export type DayPlan = { day: string; teams: TeamShifts[] };
export type VolunteersByShift = ReadonlyMap<string, AdminShiftVolunteer[]>;

export const DAY_TITLE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
export const NO_VOLUNTEERS: AdminShiftVolunteer[] = [];

const byStart = (a: Shift, b: Shift) => minutesOf(a.start) - minutesOf(b.start);

const planDays = (shifts: readonly Shift[]): DayPlan[] => {
  const byDay = Map.groupBy(shifts, (s) => s.day);
  return shiftDays(shifts).map((day) => {
    const byTeam = Map.groupBy(byDay.get(day) ?? [], (s) => s.team);
    return {
      day,
      teams: Team.options.flatMap((team) => {
        const teamShifts = byTeam.get(team);
        return teamShifts ? [{ team, shifts: teamShifts.toSorted(byStart) }] : [];
      }),
    };
  });
};

export const useShiftPlan = (shifts: readonly Shift[], volunteers: readonly AdminShiftVolunteer[]) => {
  const days = useMemo(() => planDays(shifts), [shifts]);
  const byShift: VolunteersByShift = useMemo(() => Map.groupBy(volunteers, (v) => v.shiftKey), [volunteers]);
  return { days, byShift };
};
