import { z } from 'zod';

import { personName, ProfileRef } from '~/supabase/profile';

export const ShiftVolunteer = z.object({
  id: z.uuid(),
  eventId: z.string(),
  shiftKey: z.string(),
  profileId: z.uuid().nullable(),
  volunteerName: z.string().nullable(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type ShiftVolunteer = z.infer<typeof ShiftVolunteer>;

export const AdminShiftVolunteer = ShiftVolunteer.extend({ profile: ProfileRef });
export type AdminShiftVolunteer = z.infer<typeof AdminShiftVolunteer>;

export const ShiftCount = z.object({ shiftKey: z.string(), taken: z.int().nonnegative() });

export type ShiftCounts = ReadonlyMap<string, number>;

export const VolunteerInput = ShiftVolunteer.pick({
  eventId: true,
  shiftKey: true,
  profileId: true,
  volunteerName: true,
  note: true,
});
export type VolunteerInput = z.infer<typeof VolunteerInput>;

export const NOTE_MAX = 500;
export const NAME_MAX = 100;

export const volunteerName = (v: AdminShiftVolunteer) => personName(v.volunteerName, v.profile);
