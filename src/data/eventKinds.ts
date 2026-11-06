import { z } from 'zod';

export const EventKind = z.enum(['training', 'tournament', 'social', 'meeting', 'trip', 'break']);
export type EventKind = z.infer<typeof EventKind>;

export const VISITOR_KINDS: readonly EventKind[] = [
  EventKind.enum.tournament,
  EventKind.enum.social,
  EventKind.enum.meeting,
  EventKind.enum.trip,
];
