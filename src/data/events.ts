import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

import { EventKind } from './eventKinds';

export const Team = z.enum(['hall', 'kiosk', 'secretariat']);
export type Team = z.infer<typeof Team>;

export { EventKind, VISITOR_KINDS } from './eventKinds';

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
