import { z } from 'zod';

import type { Shift } from '~/cms/calendar';
import type { AdminShiftVolunteer } from '~/volunteers/model';

export const DialogKind = z.enum(['add', 'note', 'remove']);
export type DialogKind = z.infer<typeof DialogKind>;

export type Dialog =
  | { kind: typeof DialogKind.enum.add; shift: Shift; taken: number }
  | { kind: typeof DialogKind.enum.note | typeof DialogKind.enum.remove; volunteer: AdminShiftVolunteer };
