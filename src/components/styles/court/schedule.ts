import type { Group } from '~/data/club';
import { listFormat } from '~/i18n/current';
import { minutesOf, weekdayName } from '~/utils/dates';
import type { Session } from '~/utils/training';

export type GroupSlot = { weekdays: number[]; start: string; end: string };

export const slotsOf = (group: Group, sessions: readonly Session[]): GroupSlot[] => {
  const slots = new Map<string, GroupSlot>();
  for (const s of sessions) {
    if (s.group !== group) continue;
    const key = `${s.start}-${s.end}`;
    const slot = slots.get(key) ?? { weekdays: [], start: s.start, end: s.end };
    slot.weekdays.push(s.weekday);
    slots.set(key, slot);
  }
  return Array.from(slots.values());
};

export const slotDays = (slot: GroupSlot) => listFormat().format(slot.weekdays.map((d) => weekdayName(d, 'short')));

export const groupTimes = (group: Group, sessions: readonly Session[]) =>
  slotsOf(group, sessions).map((slot) => `${slotDays(slot)} ${slot.start}–${slot.end}`);

export const dayRange = (times: readonly { start: string; end: string }[]) => ({
  first: Math.min(...times.map((s) => minutesOf(s.start))),
  last: Math.max(...times.map((s) => minutesOf(s.end))),
});
