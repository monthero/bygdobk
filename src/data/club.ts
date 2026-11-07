import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { MantineColor } from '@mantine/core';
import { z } from 'zod';

import { slugMap } from '~/utils/slugs';

export const DEAL_HASH = 'medlemsfordel';

export const CLUB = {
  name: 'Bygdø Badmintonklubb',
  shortName: 'Bygdø BK',
  founded: 1936,
} as const;

export const Group = z.enum(['rekrutt', 'junior', 'senior', 'fritt']);
export type Group = z.infer<typeof Group>;

export const GROUP_COLORS: Record<Group, MantineColor> = {
  [Group.enum.rekrutt]: 'teal',
  [Group.enum.junior]: 'blue',
  [Group.enum.senior]: 'orange',
  [Group.enum.fritt]: 'grape',
};

export const GroupStatus = z.enum(['open', 'waitlist', 'full']);
export type GroupStatus = z.infer<typeof GroupStatus>;

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
