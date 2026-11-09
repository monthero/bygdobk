import { z } from 'zod';

import { MembershipStatus, type AdminMembership, type BoardProfile } from '~/memberships/model';

import { memberName } from './format';

export const PeopleFilter = z.enum(['betalt', 'ubetalt', 'forespurt', 'uten']);
export type PeopleFilter = z.infer<typeof PeopleFilter>;

export type Person = {
  key: string;
  name: string;
  profile: BoardProfile | null;
  memberships: AdminMembership[];
  unpaid: number;
  unpaidNok: number;
  requested: number;
  active: number;
};

const isActive = (m: AdminMembership) => m.status === MembershipStatus.enum.active;
const isUnpaid = (m: AdminMembership) => isActive(m) && m.paidAt === null;
const isRequested = (m: AdminMembership) => m.status === MembershipStatus.enum.requested;

const summarize = (key: string, name: string, profile: BoardProfile | null, memberships: AdminMembership[]) => {
  const unpaid = memberships.filter(isUnpaid);
  return {
    key,
    name,
    profile,
    memberships,
    unpaid: unpaid.length,
    unpaidNok: unpaid.reduce((sum, m) => sum + m.priceNok, 0),
    requested: memberships.filter(isRequested).length,
    active: memberships.filter(isActive).length,
  } satisfies Person;
};

export const peopleOf = (profiles: readonly BoardProfile[], memberships: readonly AdminMembership[]): Person[] => {
  const byProfile = Map.groupBy(
    memberships.filter((m) => m.profileId !== null),
    (m) => m.profileId,
  );
  const withAccount = profiles.map((p) => summarize(p.id, p.name, p, byProfile.get(p.id) ?? []));
  const nameOnly = memberships
    .filter((m) => m.profileId === null)
    .map((m) => summarize(`membership-${m.id}`, memberName(m), null, [m]));
  return [...withAccount, ...nameOnly].sort((a, b) => a.name.localeCompare(b.name));
};

export const matchesFilter = (person: Person, filter: PeopleFilter | undefined) => {
  switch (filter) {
    case PeopleFilter.enum.betalt:
      return person.active > 0 && person.unpaid === 0;
    case PeopleFilter.enum.ubetalt:
      return person.unpaid > 0;
    case PeopleFilter.enum.forespurt:
      return person.requested > 0;
    case PeopleFilter.enum.uten:
      return person.active === 0 && person.requested === 0;
    default:
      return true;
  }
};

export const matchesPerson = (person: Person, query: string) =>
  [person.name, person.profile?.email, ...person.memberships.map(memberName)].some((value) =>
    value?.toLowerCase().includes(query),
  );
