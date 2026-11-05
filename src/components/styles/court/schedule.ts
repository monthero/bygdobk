import { CURRENT_SEASON, type Group, type Session } from '~/data/club';
import { minutesOf } from '~/utils/dates';

export type GroupSlot = { weekdays: number[]; start: string; end: string };

export const slotsOf = (group: Group, schedule: readonly Session[] = CURRENT_SEASON.schedule): GroupSlot[] => {
  const slots = new Map<string, GroupSlot>();
  for (const s of schedule) {
    if (s.group !== group) continue;
    const key = `${s.start}-${s.end}`;
    const slot = slots.get(key) ?? { weekdays: [], start: s.start, end: s.end };
    slot.weekdays.push(s.weekday);
    slots.set(key, slot);
  }
  return Array.from(slots.values());
};

export const dayRange = (schedule: readonly Session[]) => ({
  first: Math.min(...schedule.map((s) => minutesOf(s.start))),
  last: Math.max(...schedule.map((s) => minutesOf(s.end))),
});
