import type { ComponentType } from 'react';
import type { StructureBuilder, StructureResolver } from 'sanity/structure';
import { z } from 'zod';

import { CalendarX, Trophy } from '~/components/ui/icons';
import { Group } from '~/data/club';
import { EventKind, Team, VISITOR_KINDS } from '~/data/events';

import { fixedDocId, PRIVACY_PAGE_ID, SITE_PHOTOS_ID } from './schema';

const API_VERSION = '2026-11-01';

export const ListId = z.enum([
  'trainingTimes',
  'breaks',
  'trainingGroups',
  'upcomingEvents',
  'pastEvents',
  'volunteerTeams',
  'news',
  'membershipPlans',
  'discounts',
  'boardMembers',
  'sponsors',
]);
export type ListId = z.infer<typeof ListId>;

export const SINGLETONS = {
  notice: { type: 'notice', title: 'Notice banner' },
  socialLinks: { type: 'socialLinks', title: 'Social links' },
  [SITE_PHOTOS_ID]: { type: 'sitePhotos', title: 'Photos' },
  clubDetails: { type: 'clubDetails', title: 'Club details' },
  contactForm: { type: 'contactForm', title: 'Contact form' },
  payment: { type: 'payment', title: 'Payment' },
  [PRIVACY_PAGE_ID]: { type: 'privacyPage', title: 'Privacy page' },
} as const;

export type SingletonId = keyof typeof SINGLETONS;

export const FIXED_SETS = [
  { type: 'trainingGroup', keys: Group.options },
  { type: 'volunteerTeam', keys: Team.options },
] as const;

export const eventTemplateId = (kind: EventKind) => `event-${kind}`;

const today = () => new Date().toISOString().slice(0, 10);

const VISITOR_FILTER = '_type == "event" && kind in $kinds';
const VISITOR_TEMPLATES = VISITOR_KINDS.map(eventTemplateId);

const singleton = (S: StructureBuilder, id: SingletonId) => {
  const { type, title } = SINGLETONS[id];
  return S.listItem()
    .title(title)
    .id(id)
    .schemaType(type)
    .child(S.document().schemaType(type).documentId(id).title(title));
};

const fixedSet = (S: StructureBuilder, id: ListId, title: string, type: string, keys: readonly string[]) =>
  S.listItem()
    .title(title)
    .id(id)
    .schemaType(type)
    .child(
      S.list()
        .title(title)
        .items(keys.map((key) => S.documentListItem().schemaType(type).id(fixedDocId(type, key)))),
    );

type ListSpec = {
  id: ListId;
  title: string;
  type: string;
  filter?: string;
  params?: Record<string, unknown>;
  templates?: string[];
  newestFirst?: boolean;
  orderBy?: string;
  icon?: ComponentType;
};

const list = (S: StructureBuilder, spec: ListSpec) => {
  const { id, title, type, filter = '_type == $type', params = { type }, templates, orderBy, icon } = spec;
  let documents = S.documentList()
    .id(id)
    .title(title)
    .schemaType(type)
    .apiVersion(API_VERSION)
    .filter(filter)
    .params(params);
  if (orderBy)
    documents = documents.defaultOrdering([{ field: orderBy, direction: spec.newestFirst ? 'desc' : 'asc' }]);
  if (templates) documents = documents.initialValueTemplates(templates.map((t) => S.initialValueTemplateItem(t)));
  const item = S.listItem().title(title).id(id).schemaType(type).child(documents);
  return icon ? item.icon(icon) : item;
};

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.divider().title('Every page'),
      singleton(S, 'notice'),
      singleton(S, SITE_PHOTOS_ID),
      list(S, { id: ListId.enum.sponsors, title: 'Sponsors', type: 'sponsor', orderBy: 'order' }),
      singleton(S, 'socialLinks'),

      S.divider().title('Training'),
      list(S, {
        id: ListId.enum.trainingTimes,
        title: 'Training times',
        type: 'event',
        filter: '_type == "event" && kind == $kind',
        params: { kind: EventKind.enum.training },
        templates: [eventTemplateId(EventKind.enum.training)],
        orderBy: 'startDate',
        newestFirst: true,
      }),
      list(S, {
        id: ListId.enum.breaks,
        title: 'Breaks and canceled training',
        type: 'event',
        filter: '_type == "event" && kind == $kind',
        params: { kind: EventKind.enum.break },
        templates: [eventTemplateId(EventKind.enum.break)],
        icon: CalendarX,
        orderBy: 'startDate',
        newestFirst: true,
      }),
      fixedSet(S, ListId.enum.trainingGroups, 'Training groups', 'trainingGroup', Group.options),

      S.divider().title('Events'),
      list(S, {
        id: ListId.enum.upcomingEvents,
        title: 'Upcoming events',
        type: 'event',
        filter: `${VISITOR_FILTER} && coalesce(endDate, startDate) >= $today`,
        params: { kinds: VISITOR_KINDS, today: today() },
        templates: VISITOR_TEMPLATES,
        icon: Trophy,
        orderBy: 'startDate',
      }),
      list(S, {
        id: ListId.enum.pastEvents,
        title: 'Past events',
        type: 'event',
        filter: `${VISITOR_FILTER} && coalesce(endDate, startDate) < $today`,
        params: { kinds: VISITOR_KINDS, today: today() },
        templates: VISITOR_TEMPLATES,
        icon: Trophy,
        orderBy: 'startDate',
        newestFirst: true,
      }),
      fixedSet(S, ListId.enum.volunteerTeams, 'Volunteer teams', 'volunteerTeam', Team.options),

      S.divider().title('News'),
      list(S, { id: ListId.enum.news, title: 'News', type: 'newsPost', orderBy: 'date', newestFirst: true }),

      S.divider().title('Membership'),
      list(S, { id: ListId.enum.membershipPlans, title: 'Prices and plans', type: 'membershipPlan', orderBy: 'order' }),
      list(S, { id: ListId.enum.discounts, title: 'Discounts', type: 'discount', orderBy: 'order' }),
      singleton(S, 'payment'),

      S.divider().title('The club'),
      list(S, { id: ListId.enum.boardMembers, title: 'Board members', type: 'boardMember', orderBy: 'order' }),
      singleton(S, 'clubDetails'),
      singleton(S, 'contactForm'),
      singleton(S, PRIVACY_PAGE_ID),
    ]);
