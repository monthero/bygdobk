import { z } from 'zod';

import { seasonOf, seasonOn, type Season } from '~/cms/calendar';
import { ProfileRef } from '~/supabase/profile';
import { date, ISO_DAY, today, type Dayjs } from '~/utils/dates';

export const NAME_MAX = 100;
export const NOTE_MAX = 280;

export const PaymentMethod = z.enum(['vipps', 'bank_transfer', 'card', 'cash', 'member_site', 'other']);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const MembershipStatus = z.enum(['requested', 'active', 'declined']);
export type MembershipStatus = z.infer<typeof MembershipStatus>;

export const Membership = z.object({
  id: z.uuid(),
  profileId: z.uuid().nullable(),
  playerName: z.string().nullable(),
  planId: z.string(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  priceNok: z.int().nonnegative(),
  paidAt: z.iso.datetime({ offset: true }).nullable(),
  paymentMethod: PaymentMethod.nullable(),
  note: z.string().nullable(),
  status: MembershipStatus,
  createdBy: z.uuid().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});
export type Membership = z.infer<typeof Membership>;

export const AdminMembership = Membership.extend({ profile: ProfileRef, requester: ProfileRef });
export type AdminMembership = z.infer<typeof AdminMembership>;

export const MembershipInput = Membership.pick({
  profileId: true,
  playerName: true,
  planId: true,
  startDate: true,
  endDate: true,
  priceNok: true,
  paidAt: true,
  paymentMethod: true,
  note: true,
});
export type MembershipInput = z.infer<typeof MembershipInput>;

export type MembershipPatch = Partial<MembershipInput> & { status?: MembershipStatus };

export type RequestInput = Pick<MembershipInput, 'playerName' | 'planId' | 'startDate' | 'endDate' | 'priceNok'>;

export const seasonDates = (season: Season) => {
  const day = today();
  return {
    startDate: (seasonOn([season], day) ? day : season.start).format(ISO_DAY),
    endDate: season.end.format(ISO_DAY),
  };
};

export const membershipSeason = (m: Pick<Membership, 'startDate'>) => seasonOf(date(m.startDate));

export const isActiveOn = (m: Pick<Membership, 'startDate' | 'endDate'>, day: Dayjs = today()) =>
  !day.isBefore(date(m.startDate), 'day') && !day.isAfter(date(m.endDate), 'day');

export const isCurrent = (m: Pick<Membership, 'status' | 'startDate' | 'endDate'>) =>
  m.status === MembershipStatus.enum.active && isActiveOn(m);

export const isOwn = (m: Pick<Membership, 'profileId' | 'playerName'>, userId: string | undefined) =>
  m.profileId === userId && m.playerName === null;
