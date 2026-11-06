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

export const EventKind = z.enum(['training', 'tournament', 'social', 'meeting', 'trip', 'break']);
export type EventKind = z.infer<typeof EventKind>;

const SHIFT_KINDS = new Set<string>([EventKind.enum.tournament, EventKind.enum.social]);

export const allowsShifts = ({ kind, ownEvent }: { kind?: string; ownEvent?: boolean }) =>
  ownEvent === true && kind !== undefined && SHIFT_KINDS.has(kind);

export const EVENT_KINDS: Record<EventKind, { label: MessageDescriptor; color: string }> = {
  [EventKind.enum.training]: { label: msg({ message: 'Training', comment: 'Event type' }), color: 'brand' },
  [EventKind.enum.break]: {
    label: msg({ message: 'Break', comment: 'Event type: no training, e.g. holidays' }),
    color: 'gray',
  },
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

export const EventsShow = z.enum(['kommende', 'tidligere']);
export type EventsShow = z.infer<typeof EventsShow>;
