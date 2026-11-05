import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

export const Team = z.enum(['hall', 'kiosk', 'secretariat']);
export type Team = z.infer<typeof Team>;

export const TEAMS: Record<Team, { name: MessageDescriptor; what: MessageDescriptor }> = {
  [Team.enum.hall]: {
    name: msg({ message: 'Hall', comment: 'Volunteer team that sets up courts and equipment' }),
    what: msg`Set up courts and equipment, count balls and tidy up afterwards.`,
  },
  [Team.enum.kiosk]: {
    name: msg({ message: 'Kiosk', comment: 'Volunteer team that runs the food stand' }),
    what: msg`Run the kiosk: waffles, toast and pizza baguettes.`,
  },
  [Team.enum.secretariat]: {
    name: msg({ message: 'Secretariat', comment: 'Volunteer team that runs the match desk' }),
    what: msg`Enter results, call matches and share information.`,
  },
};

export type Shift = {
  id: string;
  team: Team;
  day: string;
  start: string;
  end?: string;
  spots: number;
  setup?: boolean;
};

const day = (team: Team, iso: string, slots: [string, string, number][]): Shift[] =>
  slots.map(([start, end, spots]) => ({ id: `${team}-${iso}-${start}`, team, day: iso, start, end, spots }));

export const HOSTTREFF_SHIFTS: Shift[] = [
  { id: 'hall-setup', team: Team.enum.hall, day: '2026-10-30', start: '19:00', spots: 4, setup: true },
  { id: 'kiosk-setup', team: Team.enum.kiosk, day: '2026-10-30', start: '19:00', spots: 2, setup: true },
  ...day(Team.enum.hall, '2026-10-31', [
    ['08:00', '12:00', 1],
    ['12:00', '16:00', 1],
    ['16:00', '20:00', 1],
  ]),
  ...day(Team.enum.hall, '2026-11-01', [
    ['08:00', '12:00', 1],
    ['12:00', '16:00', 1],
    ['16:00', '20:00', 1],
  ]),
  { id: 'hall-teardown', team: Team.enum.hall, day: '2026-11-01', start: '19:00', spots: 4, setup: true },
  ...day(Team.enum.kiosk, '2026-10-31', [
    ['08:30', '12:00', 3],
    ['12:00', '15:30', 3],
    ['15:30', '19:30', 3],
  ]),
  ...day(Team.enum.kiosk, '2026-11-01', [
    ['08:30', '12:00', 3],
    ['12:00', '15:30', 3],
    ['15:30', '19:30', 3],
  ]),
  ...day(Team.enum.secretariat, '2026-10-31', [
    ['08:00', '12:00', 3],
    ['12:00', '16:00', 3],
    ['16:00', '20:00', 3],
  ]),
  ...day(Team.enum.secretariat, '2026-11-01', [
    ['08:00', '12:00', 3],
    ['12:00', '16:00', 3],
    ['16:00', '20:00', 3],
  ]),
];

export const HOSTTREFF_DAYS = ['2026-10-30', '2026-10-31', '2026-11-01'];

export const EventKind = z.enum(['tournament', 'social', 'meeting', 'trip']);
export type EventKind = z.infer<typeof EventKind>;

export const EVENT_KINDS: Record<EventKind, { label: MessageDescriptor; color: string }> = {
  [EventKind.enum.tournament]: { label: msg({ message: 'Tournament', comment: 'Event type' }), color: 'orange' },
  [EventKind.enum.social]: {
    label: msg({ message: 'Social', comment: 'Event type: party or get-together' }),
    color: 'grape',
  },
  [EventKind.enum.meeting]: {
    label: msg({ message: 'Meeting', comment: 'Event type, e.g. the annual meeting' }),
    color: 'blue',
  },
  [EventKind.enum.trip]: {
    label: msg({ message: 'Trip', comment: 'Event type: travel to another club’s tournament' }),
    color: 'teal',
  },
};

export type ClubEvent = {
  slug: string;
  kind: EventKind;
  name: string;
  from: string | null;
  to: string | null;
  sortDate: string;
  season: MessageDescriptor;
  description: MessageDescriptor;
  ownEvent: boolean;
  tip?: { title: MessageDescriptor; text: MessageDescriptor };
  shifts?: { days: string[]; list: Shift[] };
};

export const EVENTS: ClubEvent[] = [
  {
    slug: 'vartreff-2027',
    kind: EventKind.enum.tournament,
    name: 'Vårtreff 2027',
    from: null,
    to: null,
    sortDate: '2027-04-01',
    season: msg`Spring 2027, date to be announced`,
    description: msg`The club’s spring tournament at Bygdøhus. Members help in the hall, kiosk and secretariat.`,
    ownEvent: true,
  },
  {
    slug: 'hosttreff-2026',
    kind: EventKind.enum.tournament,
    name: 'Høsttreff 2026',
    from: '2026-10-31',
    to: '2026-11-01',
    sortDate: '2026-10-31',
    season: msg`Autumn 2026`,
    description: msg`The club’s autumn tournament at Bygdøhus, and an important source of income for the club.`,
    ownEvent: true,
    tip: {
      title: msg`Baking counts too`,
      text: msg`Waffle batter and cakes for the kiosk are also part of the volunteering.`,
    },
    shifts: { days: HOSTTREFF_DAYS, list: HOSTTREFF_SHIFTS },
  },
];

export const EVENTS_BY_DATE = EVENTS.toSorted((a, b) => a.sortDate.localeCompare(b.sortDate));

export const isPast = (event: ClubEvent, todayIso: string) => (event.to ?? event.sortDate) < todayIso;

export const isOngoing = (event: ClubEvent, todayIso: string) =>
  event.from !== null && event.to !== null && event.from <= todayIso && todayIso <= event.to;

export const splitEvents = (todayIso: string, events = EVENTS_BY_DATE) => ({
  upcoming: events.filter((e) => !isPast(e, todayIso)),
  past: events.filter((e) => isPast(e, todayIso)).reverse(),
});

export const EventsShow = z.enum(['kommende', 'tidligere']);
export type EventsShow = z.infer<typeof EventsShow>;

export const eventYear = (event: ClubEvent) => Number((event.from ?? event.sortDate).slice(0, 4));

export const EVENT_YEARS = [...new Set(EVENTS.map(eventYear))].sort((a, b) => a - b);

export const eventBySlug = (slug: string) => EVENTS.find((e) => e.slug === slug);
