import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { MantineColor } from '@mantine/core';
import { z } from 'zod';

import { date, ISO_DAY } from '~/utils/dates';
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
  facebookUrl: 'https://www.facebook.com/groups/1290988944285749/',
  instagramUrl: 'https://www.instagram.com/bygdobk/',
  currentSiteUrl: 'https://www.bygdobadminton.no',
  memberLoginUrl: 'https://www.bygdobadminton.no/next/account/memberships',
  joinUrl: 'https://www.bygdobadminton.no/next/membership/register',
  privacyUrl: 'https://www.idrettenonline.no/p/2195/avtalevilkar',
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

export type Session = { weekday: number; group: Group; start: string; end: string };

export const SCHEDULE: Session[] = [
  { weekday: 1, group: Group.enum.fritt, start: '19:00', end: '21:00' },
  { weekday: 2, group: Group.enum.rekrutt, start: '18:00', end: '19:00' },
  { weekday: 2, group: Group.enum.junior, start: '19:00', end: '20:00' },
  { weekday: 2, group: Group.enum.senior, start: '19:00', end: '22:00' },
  { weekday: 4, group: Group.enum.rekrutt, start: '18:00', end: '19:00' },
  { weekday: 4, group: Group.enum.junior, start: '19:00', end: '20:30' },
  { weekday: 4, group: Group.enum.senior, start: '19:00', end: '22:00' },
];

export type Season = { id: string; label: string; start: string; end: string; schedule: Session[] };

const SEASON_2026: Season = {
  id: '2026-27',
  label: '2026/27',
  start: '2026-08-17',
  end: '2027-06-18',
  schedule: SCHEDULE,
};
const SEASON_2025: Season = {
  id: '2025-26',
  label: '2025/26',
  start: '2025-08-18',
  end: '2026-06-19',
  schedule: SCHEDULE,
};

export const SEASONS: Season[] = [SEASON_2026, SEASON_2025];

export const CURRENT_SEASON = SEASON_2026;

export const seasonById = (id: string) => SEASONS.find((s) => s.id === id);

export const ClosureId = z.enum(['nm-rigging-2026', 'summer-2026', 'autumn-break-2026']);
export type ClosureId = z.infer<typeof ClosureId>;

export type Closure = { id: ClosureId; from: string; to: string; reason: MessageDescriptor };

const gapBetween = (before: Season, after: Season) => ({
  from: date(before.end).add(1, 'day').format(ISO_DAY),
  to: date(after.start).subtract(1, 'day').format(ISO_DAY),
});

export const CLOSURES: Closure[] = [
  {
    id: ClosureId.enum['nm-rigging-2026'],
    from: '2026-01-29',
    to: '2026-01-29',
    reason: msg`Hall setup for the national championships`,
  },
  { id: ClosureId.enum['summer-2026'], ...gapBetween(SEASON_2025, SEASON_2026), reason: msg`Summer break` },
  {
    id: ClosureId.enum['autumn-break-2026'],
    from: '2026-09-29',
    to: '2026-10-01',
    reason: msg`Autumn break, no organized training`,
  },
];

export const closureById = (id: ClosureId) => CLOSURES.find((c) => c.id === id);

export const PriceKind = z.enum(['season', 'membership', 'dropin', 'trial']);
export type PriceKind = z.infer<typeof PriceKind>;

export type Price = {
  id: string;
  kind: PriceKind;
  name: MessageDescriptor;
  note: MessageDescriptor;
  membership: number;
  training: number;
  perVisit?: number;
};

export const MEMBERSHIP_FEE = 235;

export const PRICES: Price[] = [
  {
    id: 'rekrutt',
    kind: PriceKind.enum.season,
    name: GROUPS.rekrutt.name,
    note: msg`New players, coached`,
    membership: MEMBERSHIP_FEE,
    training: 2940,
  },
  {
    id: 'junior',
    kind: PriceKind.enum.season,
    name: GROUPS.junior.name,
    note: msg`Children and teens, coached`,
    membership: MEMBERSHIP_FEE,
    training: 4040,
  },
  {
    id: 'senior',
    kind: PriceKind.enum.season,
    name: GROUPS.senior.name,
    note: msg`Adult players`,
    membership: MEMBERSHIP_FEE,
    training: 4040,
  },
  {
    id: 'trial',
    kind: PriceKind.enum.trial,
    name: msg`Trial membership`,
    note: msg`Beginners aged 7–12, half a season`,
    membership: 500,
    training: 0,
  },
  {
    id: 'member',
    kind: PriceKind.enum.membership,
    name: msg`Membership only`,
    note: msg`For breaks, or parents of players`,
    membership: MEMBERSHIP_FEE,
    training: 0,
  },
  {
    id: 'dropin',
    kind: PriceKind.enum.dropin,
    name: msg`Drop-in`,
    note: msg`Membership, then pay per visit with Vipps`,
    membership: MEMBERSHIP_FEE,
    training: 0,
    perVisit: 140,
  },
];

export const seasonTotal = (price: Price) => price.membership + price.training;

export const DISCOUNTS: { title: MessageDescriptor; body: MessageDescriptor }[] = [
  { title: msg`Sibling discount`, body: msg`Half price from the second sibling.` },
  {
    title: msg`Beginner discount`,
    body: msg`Half price on the Beginners group in your first season.`,
  },
  {
    title: msg`Financial support`,
    body: msg`We help you apply to the city for support, so everyone can play.`,
  },
];

export const BringKind = z.enum(['shoes', 'racket', 'water']);
export type BringKind = z.infer<typeof BringKind>;

export type BringItem = { kind: BringKind; label: MessageDescriptor; note?: MessageDescriptor };

export const BRING: BringItem[] = [
  { kind: BringKind.enum.shoes, label: msg`Indoor shoes` },
  { kind: BringKind.enum.racket, label: msg`A racket`, note: msg`Or borrow one at coached sessions` },
  { kind: BringKind.enum.water, label: msg`A water bottle` },
];

export const BRING_NOTE = msg`Shuttles are included at coached sessions.`;

export type BoardMember = { name: string; role: MessageDescriptor; photo: string; email: string; phone?: string };

const boardPhoto = (path: string) =>
  `https://cdn-bloc.no/widget/200000195/6678/${path}?width=320&height=320&quality=90&scale=both&mode=crop`;

export const BOARD: BoardMember[] = [
  {
    name: 'Lars Tingstad',
    role: msg`Chair`,
    photo: boardPhoto('2026/10/13/screenshot-2026-10-13-192417.png'),
    email: 'larst100@gmail.com',
    phone: '91397657',
  },
  {
    name: 'Ole Aabye',
    role: msg`Vice chair, events`,
    photo: boardPhoto('2026/10/13/screenshot_2026_10_13_192504.png'),
    email: 'ole.aabye@gmail.com',
    phone: '90662750',
  },
  {
    name: 'Sanford Chin',
    role: msg`Head of sport`,
    photo: boardPhoto('2023/4/29/1665833181787.jpeg'),
    email: 'stannychin@icloud.com',
    phone: '90697789',
  },
  {
    name: 'Viktor Sandström',
    role: msg`Finance`,
    photo: boardPhoto('2026/10/13/1611252114069.jpeg'),
    email: 'viktorsandstrm@gmail.com',
    phone: '40341537',
  },
  {
    name: 'Ram Kumar',
    role: msg`Board member`,
    photo: boardPhoto('2026/10/13/841316406_1413520234267079_7897630397837571049_n.jpg'),
    email: 'ram@ramk.info',
  },
];
