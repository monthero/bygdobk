import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { MantineColor } from '@mantine/core';
import { z } from 'zod';

import { slugMap } from '~/utils/slugs';

export const DEAL_HASH = 'medlemsfordel';

export const CLUB = {
  name: 'Bygdø Badmintonklubb',
  shortName: 'Bygdø BK',
  venue: 'Bygdøhus',
  address: 'Huk Aveny 45, 0287 Oslo',
  email: 'styret@bygdobk.no',
  orgNr: '993 621 358',
  vipps: '84624',
  whistleblowingUrl: 'https://www.idrettsforbundet.no/tema/varsling/jeg-vil-varsle/',
  sportModernUrl: 'https://www.sportmodern.no',
  founded: 1936,
} as const;

export const Group = z.enum(['rekrutt', 'junior', 'senior', 'fritt']);
export type Group = z.infer<typeof Group>;

export const GROUPS: Record<
  Group,
  { name: MessageDescriptor; who: MessageDescriptor; coached: boolean; color: MantineColor }
> = {
  [Group.enum.rekrutt]: {
    name: msg({ message: 'Beginners', comment: 'Training group for new players. Norwegian: Rekrutt' }),
    who: msg`For new players, with a coach.`,
    coached: true,
    color: 'teal',
  },
  [Group.enum.junior]: {
    name: msg({ message: 'Junior', comment: 'Training group for children and teens' }),
    who: msg`Coached sessions for children and teens who have played a bit.`,
    coached: true,
    color: 'blue',
  },
  [Group.enum.senior]: {
    name: msg({ message: 'Adults', comment: 'Training group for adults. Norwegian: Senior (voksne)' }),
    who: msg`Play for adult players.`,
    coached: false,
    color: 'orange',
  },
  [Group.enum.fritt]: {
    name: msg({ message: 'Open play', comment: 'Free play for all members. Norwegian: Fritt spill' }),
    who: msg`Open play for all members.`,
    coached: false,
    color: 'grape',
  },
};

export const GROUP_SLUGS = slugMap<Group>({
  [Group.enum.rekrutt]: 'rekrutt',
  [Group.enum.junior]: 'junior',
  [Group.enum.senior]: 'senior',
  [Group.enum.fritt]: 'fritt-spill',
});

export const PriceKind = z.enum(['season', 'membership', 'dropin', 'trial']);
export type PriceKind = z.infer<typeof PriceKind>;

export const PlanAudience = z.enum(['adult', 'child', 'all']);
export type PlanAudience = z.infer<typeof PlanAudience>;

export const BringKind = z.enum(['shoes', 'racket', 'water']);
export type BringKind = z.infer<typeof BringKind>;

export type BringItem = { kind: BringKind; label: MessageDescriptor; note?: MessageDescriptor };

export const BRING: BringItem[] = [
  { kind: BringKind.enum.shoes, label: msg`Indoor shoes` },
  { kind: BringKind.enum.racket, label: msg`A racket`, note: msg`Or borrow one at coached sessions` },
  { kind: BringKind.enum.water, label: msg`A water bottle` },
];

export const BRING_NOTE = msg`Shuttles are included at coached sessions.`;
