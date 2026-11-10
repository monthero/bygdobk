import {
  defineArrayMember,
  defineField,
  defineType,
  getDraftId,
  getPublishedId,
  type CustomValidator,
  type ConditionalProperty,
} from 'sanity';
import { z } from 'zod';

import {
  CalendarBlank,
  Coins,
  Handshake,
  IdentificationBadge,
  Newspaper,
  ShieldCheck,
  Tag,
  UsersThree,
  HandHeart,
} from '~/components/ui/icons';
import { Group, GroupStatus, PlanAudience, PriceKind } from '~/data/club';
import { allowsShifts, EventKind, Team } from '~/data/events';
import { InternalPath, NewsKind } from '~/data/news';
import { PERK_ICON_NAMES, PerkIcon } from '~/data/sponsors';
import { normalizeEmail } from '~/utils/email';

import { SANITY_API_VERSION } from '../sanityApi';
import { BannerInput } from './BannerInput';
import {
  AUDIENCE_TITLES,
  EVENT_KIND_TITLES,
  GROUP_TITLES,
  NEWS_KIND_TITLES,
  PRICE_KIND_TITLES,
  SHORT_DATE,
  TEAM_TITLES,
  titledList,
  titleOf,
} from './labels';
import { VisitorKindInput } from './VisitorKindInput';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const options = (values: readonly string[]) => ({ list: values.map((value) => ({ title: value, value })) });

const required = <R extends { required: () => R }>(rule: R) => rule.required();

const time = (name: string, title: string, isRequired = true) =>
  defineField({
    name,
    title,
    type: 'string',
    description: 'HH:mm, for example 19:00',
    validation: (rule) => {
      const base = rule.regex(TIME, { name: 'time' });
      return isRequired ? base.required() : base;
    },
  });

const slug = (source: string) =>
  defineField({ name: 'slug', title: 'URL name', type: 'slug', options: { source }, validation: required });

const hasAsset = (image: unknown) =>
  typeof image === 'object' && image !== null && 'asset' in image && Boolean(image.asset);

const bannerField = (description: string, extra: { group?: string; hidden?: ConditionalProperty } = {}) =>
  defineField({
    name: 'banner',
    title: 'Banner image',
    type: 'image',
    description,
    ...extra,
    options: { hotspot: true },
    components: { input: BannerInput },
    fields: [
      defineField({
        name: 'alt',
        title: 'Describe the image',
        type: 'localeString',
        validation: (rule) => rule.custom((alt, { parent }) => (hasAsset(parent) && !alt ? 'Required' : true)),
      }),
    ],
  });

const order = defineField({ name: 'order', title: 'Order', type: 'number', description: 'Lower comes first' });

export const privacyPage = defineType({
  name: 'privacyPage',
  title: 'Privacy',
  type: 'document',
  icon: ShieldCheck,
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'localeString', validation: required }),
    defineField({ name: 'body', title: 'Text', type: 'localeBody', validation: required }),
    defineField({ name: 'updatedAt', title: 'Last updated', type: 'date', validation: required }),
  ],
  preview: { prepare: () => ({ title: 'Privacy' }) },
});

export const newsPost = defineType({
  name: 'newsPost',
  title: 'News',
  type: 'document',
  icon: Newspaper,
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'localeString', validation: required }),
    slug('title.nb'),
    defineField({ name: 'date', title: 'Date', type: 'date', validation: required }),
    defineField({
      name: 'kind',
      title: 'Category',
      type: 'string',
      options: { list: titledList(NEWS_KIND_TITLES, NewsKind.options), layout: 'radio', direction: 'horizontal' },
      validation: required,
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'localeText', validation: required }),
    bannerField(
      "Optional. A wide photo shown behind the title and on news cards. Without it, the site uses one of the club's photos. Posters and other images go in the article.",
    ),
    defineField({ name: 'body', title: 'Article', type: 'localeBody', validation: required }),
    defineField({
      name: 'event',
      title: 'About an event or break',
      type: 'reference',
      to: [{ type: 'event' }],
      description: 'The post moves to the archive once the event or break is over.',
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'newsLink',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'localeString', validation: required }),
            defineField({
              name: 'page',
              title: 'Page on this site',
              type: 'string',
              options: options(InternalPath.options),
            }),
            defineField({ name: 'hash', title: 'Section on the page', type: 'string' }),
            defineField({ name: 'url', title: 'Or a link to another site', type: 'url' }),
          ],
          validation: (rule) =>
            rule.custom((link: { page?: string; url?: string } | undefined) =>
              link && Boolean(link.page) === Boolean(link.url) ? 'Pick a page or add a link, not both' : true,
            ),
          preview: { select: { title: 'label.nb', subtitle: 'page' } },
        }),
      ],
    }),
  ],
  orderings: [{ title: 'Newest first', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] }],
  preview: { select: { title: 'title.nb', subtitle: 'date', media: 'banner' } },
});

const ISO_WEEKDAYS = Array.from({ length: 7 }, (_, i) => i + 1);

type EventDoc = {
  kind?: string;
  ownEvent?: boolean;
  dateConfirmed?: boolean;
  startDate?: string;
  recurrence?: unknown;
};

const kindOf = (document: unknown) => (document as EventDoc | undefined)?.kind;
const isTraining = ({ document }: { document?: unknown }) => kindOf(document) === EventKind.enum.training;
const isPlain = ({ document }: { document?: unknown }) => {
  const kind = kindOf(document);
  return kind === EventKind.enum.training || kind === EventKind.enum.break;
};

const noShifts = ({ document }: { document?: unknown }) => !allowsShifts((document ?? {}) as EventDoc);

const requiredFor =
  (needs: (doc: EventDoc) => boolean, message = 'Required'): CustomValidator =>
  (value, { document }) =>
    needs((document ?? {}) as EventDoc) && (value === undefined || value === null || value === '') ? message : true;

const forTraining = (doc: EventDoc) => doc.kind === EventKind.enum.training;
const notTraining = (doc: EventDoc) => doc.kind !== EventKind.enum.training;

const EventTab = z.enum(['about', 'when', 'where', 'signup', 'volunteers']);

const plainTab = ({ document }: { document?: unknown }) => isPlain({ document });

const SHORT_WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const LONG_WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' });

const shortDate = (iso: string | undefined) => (iso ? SHORT_DATE.format(new Date(`${iso}T12:00:00Z`)) : '');

const weekdayShort = (isoWeekday: number) => SHORT_WEEKDAY.format(new Date(Date.UTC(2024, 0, isoWeekday)));

const weekdayLong = (isoWeekday: number) => LONG_WEEKDAY.format(new Date(Date.UTC(2024, 0, isoWeekday)));

const dateRange = (start: string | undefined, end: string | undefined) =>
  end && end !== start ? `${shortDate(start)} – ${shortDate(end)}` : shortDate(start);

const timeRange = (start: string | undefined, end: string | undefined) => [start, end].filter(Boolean).join('–');

type EventPreview = {
  kind?: string;
  title?: string;
  group?: string;
  groups?: string[];
  start?: string;
  end?: string;
  startTime?: string;
  endTime?: string;
  weekdays?: number[];
  until?: string;
  venue?: string;
};

const trainingPreview = ({ group, start, startTime, endTime, weekdays, until, venue }: EventPreview) => ({
  title: titleOf(GROUP_TITLES, group) ?? 'Training time',
  subtitle: [
    [(weekdays ?? []).map(weekdayShort).join(', '), timeRange(startTime, endTime)].filter(Boolean).join(' '),
    dateRange(start, until),
    venue,
  ]
    .filter(Boolean)
    .join(' · '),
});

const breakPreview = ({ title, groups, start, end, startTime, endTime }: EventPreview) => ({
  title,
  subtitle: [
    dateRange(start, end),
    timeRange(startTime, endTime),
    groups?.length ? groups.map((g) => titleOf(GROUP_TITLES, g)).join(', ') : 'All groups',
  ]
    .filter(Boolean)
    .join(' · '),
});

export const event = defineType({
  name: 'event',
  title: 'Calendar event',
  type: 'document',
  icon: CalendarBlank,
  groups: [
    { name: EventTab.enum.about, title: 'About', hidden: plainTab },
    { name: EventTab.enum.when, title: 'Date and time', hidden: plainTab },
    { name: EventTab.enum.where, title: 'Place', hidden: plainTab },
    { name: EventTab.enum.signup, title: 'Sign-up', hidden: plainTab },
    { name: EventTab.enum.volunteers, title: 'Volunteers', hidden: (ctx) => plainTab(ctx) || noShifts(ctx) },
  ],
  fields: [
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      group: EventTab.enum.about,
      options: { list: titledList(EVENT_KIND_TITLES, EventKind.options), layout: 'radio', direction: 'horizontal' },
      components: { input: VisitorKindInput },
      hidden: isPlain,
      validation: required,
    }),
    defineField({
      name: 'group',
      title: 'Training group',
      type: 'string',
      options: { list: titledList(GROUP_TITLES, Group.options), layout: 'radio' },
      hidden: (ctx) => !isTraining(ctx),
      validation: (rule) => rule.custom(requiredFor(forTraining)),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      group: EventTab.enum.about,
      description: 'For a break, the reason, for example "Fall break". It shows on the training page.',
      hidden: isTraining,
      validation: (rule) => rule.custom(requiredFor(notTraining)),
    }),
    defineField({
      name: 'slug',
      title: 'URL name',
      type: 'slug',
      group: EventTab.enum.about,
      description: 'The end of the page address. Click "Generate" to make it from the title.',
      options: { source: 'title.nb' },
      hidden: isPlain,
      validation: (rule) =>
        rule.custom(requiredFor((doc) => doc.kind !== EventKind.enum.training && doc.kind !== EventKind.enum.break)),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localeText',
      group: EventTab.enum.about,
      hidden: isTraining,
    }),
    bannerField(
      'Optional. A wide photo shown at the top of the event page and on event cards. Without it, the site uses the default events photo.',
      { group: EventTab.enum.about, hidden: isTraining },
    ),
    defineField({
      name: 'ownEvent',
      title: 'Organized by the club',
      type: 'boolean',
      group: EventTab.enum.about,
      description: 'Turn on for our own tournaments and parties. Members can then sign up for volunteer shifts.',
      initialValue: false,
      hidden: isPlain,
    }),
    defineField({
      name: 'tip',
      title: 'Tip box',
      type: 'object',
      group: EventTab.enum.about,
      description: 'Optional. A highlighted box on the event page, for example about parking.',
      options: { collapsible: true, collapsed: true },
      hidden: isPlain,
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'localeString' }),
        defineField({ name: 'text', title: 'Text', type: 'localeText' }),
      ],
    }),
    defineField({
      name: 'startDate',
      title: 'First day',
      type: 'date',
      group: EventTab.enum.when,
      description: 'For a training time, the first training day of the season.',
      options: { dateFormat: 'D MMM YYYY' },
      validation: required,
    }),
    defineField({
      name: 'endDate',
      title: 'Last day',
      type: 'date',
      group: EventTab.enum.when,
      description: 'Leave it empty for a single day.',
      options: { dateFormat: 'D MMM YYYY' },
      hidden: isTraining,
      validation: (rule) =>
        rule.custom((end: string | undefined, { document }) => {
          const start = (document as EventDoc | undefined)?.startDate;
          return !end || !start || end >= start ? true : 'The last day must be on or after the first day';
        }),
    }),
    defineField({
      name: 'recurrence',
      title: 'Repeats every week',
      type: 'object',
      description: 'Training repeats on these days, from the first day until the last.',
      options: { collapsible: false },
      hidden: (ctx) => !isTraining(ctx),
      validation: (rule) => rule.custom(requiredFor(forTraining)),
      fields: [
        defineField({
          name: 'weekdays',
          title: 'On',
          type: 'array',
          of: [defineArrayMember({ type: 'number' })],
          options: { list: ISO_WEEKDAYS.map((value) => ({ title: weekdayLong(value), value })), layout: 'grid' },
          validation: (rule) => rule.required().min(1),
        }),
        defineField({
          name: 'until',
          title: 'Until',
          type: 'date',
          options: { dateFormat: 'D MMM YYYY' },
          validation: required,
        }),
      ],
    }),
    {
      ...time('startTime', 'Starts at', false),
      group: EventTab.enum.when,
      description: 'HH:mm, for example 19:00. For a break, leave both times empty to cover whole days.',
    },
    { ...time('endTime', 'Ends at', false), group: EventTab.enum.when },
    defineField({
      name: 'dateConfirmed',
      title: 'The date is set',
      type: 'boolean',
      group: EventTab.enum.when,
      initialValue: true,
      description: 'Turn it off while the date is not decided. The first day is then only used to sort.',
      hidden: isPlain,
    }),
    defineField({
      name: 'whenText',
      title: 'When, in words',
      type: 'localeString',
      group: EventTab.enum.when,
      description: 'For example "Spring 2027, date to be announced".',
      hidden: (ctx) => isPlain(ctx) || (ctx.document as EventDoc | undefined)?.dateConfirmed !== false,
      validation: (rule) =>
        rule.custom(requiredFor((doc) => doc.dateConfirmed === false, 'Say roughly when, while the date is not set')),
    }),
    defineField({
      name: 'groups',
      title: 'Only for these groups',
      type: 'array',
      group: EventTab.enum.about,
      of: [defineArrayMember({ type: 'string' })],
      options: { list: titledList(GROUP_TITLES, Group.options), layout: 'grid' },
      description: 'Leave it empty if it is for everyone. Training for these groups is off while it happens.',
      hidden: isTraining,
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'object',
      group: EventTab.enum.where,
      description: 'Leave it empty if it is in the home hall from Club details. A trip always needs a venue.',
      hidden: ({ document }) => kindOf(document) === EventKind.enum.break,
      validation: (rule) =>
        rule.custom(requiredFor((doc) => doc.kind === EventKind.enum.trip, 'Say where the trip goes')),
      fields: [
        defineField({ name: 'name', title: 'Name', type: 'string', validation: required }),
        defineField({ name: 'address', title: 'Address', type: 'string' }),
        defineField({
          name: 'mapUrl',
          title: 'Map link',
          type: 'url',
          description: 'Optional. Without it, the site opens the address in the visitor’s map app.',
        }),
      ],
    }),
    defineField({
      name: 'registrationUrl',
      title: 'Registration link',
      type: 'url',
      group: EventTab.enum.signup,
      description: 'Where people sign up, for example the organizer’s tournament system.',
      hidden: isPlain,
    }),
    defineField({
      name: 'registrationDeadline',
      title: 'Registration deadline',
      type: 'datetime',
      group: EventTab.enum.signup,
      options: { dateFormat: 'D MMM YYYY', timeFormat: 'HH:mm' },
      hidden: isPlain,
    }),
    defineField({
      name: 'shifts',
      title: 'Volunteer shifts',
      type: 'array',
      group: EventTab.enum.volunteers,
      description: 'Members sign up for these on the event page.',
      hidden: noShifts,
      of: [
        defineArrayMember({
          type: 'object',
          name: 'shift',
          fields: [
            defineField({
              name: 'team',
              title: 'Team',
              type: 'string',
              options: { list: titledList(TEAM_TITLES, Team.options), layout: 'radio', direction: 'horizontal' },
              validation: required,
            }),
            defineField({
              name: 'day',
              title: 'Day',
              type: 'date',
              options: { dateFormat: 'D MMM YYYY' },
              validation: required,
            }),
            time('start', 'Start'),
            time('end', 'End', false),
            defineField({
              name: 'spots',
              title: 'People needed',
              type: 'number',
              validation: (rule) => rule.required().integer().min(1),
            }),
            defineField({ name: 'setup', title: 'Setup or teardown', type: 'boolean', initialValue: false }),
          ],
          preview: {
            select: { team: 'team', day: 'day', start: 'start', end: 'end', spots: 'spots' },
            prepare: ({ team, day, start, end, spots }: Record<string, string | undefined>) => ({
              title: [titleOf(TEAM_TITLES, team), timeRange(start, end)].filter(Boolean).join(' · '),
              subtitle: [shortDate(day), spots && `${spots} people`].filter(Boolean).join(' · '),
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'signupUrl',
      title: 'Extra sign-up link',
      type: 'url',
      group: EventTab.enum.volunteers,
      description:
        'Optional. An outside sign-up sheet, for example a Google Sheet, shown as an extra button. Members can always sign up on the website.',
      hidden: noShifts,
    }),
  ],
  validation: (rule) =>
    rule.custom((document) => {
      const doc = document as (EventDoc & { startTime?: string; endTime?: string }) | undefined;
      if (doc?.kind !== EventKind.enum.training) return true;
      return doc.startTime && doc.endTime ? true : 'Training needs a start and end time';
    }),
  orderings: [
    { title: 'Newest first', name: 'startDesc', by: [{ field: 'startDate', direction: 'desc' }] },
    { title: 'Oldest first', name: 'startAsc', by: [{ field: 'startDate', direction: 'asc' }] },
  ],
  preview: {
    select: {
      kind: 'kind',
      title: 'title.nb',
      group: 'group',
      groups: 'groups',
      start: 'startDate',
      end: 'endDate',
      startTime: 'startTime',
      endTime: 'endTime',
      weekdays: 'recurrence.weekdays',
      until: 'recurrence.until',
      venue: 'venue.name',
    },
    prepare: (value: EventPreview) => {
      if (value.kind === EventKind.enum.training) return trainingPreview(value);
      if (value.kind === EventKind.enum.break) return breakPreview(value);
      return {
        title: value.title,
        subtitle: [titleOf(EVENT_KIND_TITLES, value.kind), dateRange(value.start, value.end), value.venue]
          .filter(Boolean)
          .join(' · '),
      };
    },
  },
});

export const membershipPlan = defineType({
  name: 'membershipPlan',
  title: 'Membership plan',
  type: 'document',
  icon: Coins,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: required }),
    slug('name.nb'),
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      options: { list: titledList(PRICE_KIND_TITLES, PriceKind.options), layout: 'radio' },
      validation: required,
    }),
    defineField({
      name: 'audience',
      title: 'Who can pick it',
      type: 'string',
      options: {
        list: titledList(AUDIENCE_TITLES, PlanAudience.options),
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: PlanAudience.enum.all,
      validation: required,
    }),
    defineField({
      name: 'group',
      title: 'Training group',
      type: 'string',
      options: { list: titledList(GROUP_TITLES, Group.options) },
      hidden: ({ parent }: { parent?: { kind?: string } }) => parent?.kind !== PriceKind.enum.season,
    }),
    defineField({ name: 'note', title: 'Who it is for', type: 'localeString', validation: required }),
    defineField({
      name: 'membership',
      title: 'Membership fee (NOK)',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'training',
      title: 'Training fee (NOK)',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'perVisit',
      title: 'Price per visit (NOK)',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    order,
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name.nb', kind: 'kind', membership: 'membership', training: 'training', perVisit: 'perVisit' },
    prepare: ({ title, kind, membership, training, perVisit }: Record<string, string | number | undefined>) => ({
      title: String(title ?? ''),
      subtitle: [
        titleOf(PRICE_KIND_TITLES, typeof kind === 'string' ? kind : undefined),
        `kr ${Number(membership ?? 0) + Number(training ?? 0)}`,
        perVisit === undefined ? undefined : `+ kr ${perVisit} per visit`,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
});

export const discount = defineType({
  name: 'discount',
  title: 'Discount',
  type: 'document',
  icon: Tag,
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'localeString', validation: required }),
    defineField({ name: 'body', title: 'Text', type: 'localeText', validation: required }),
    order,
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title.nb', subtitle: 'body.nb' } },
});

const SAME_EMAIL_QUERY = 'count(*[_type == "boardMember" && !(_id in $ids) && lower(email) == $email])';

const uniqueEmail: CustomValidator<string | undefined> = async (email, { document, getClient }) => {
  if (!email || !document) return true;
  const id = getPublishedId(document._id);
  const count = z.number().parse(
    await getClient({ apiVersion: SANITY_API_VERSION }).fetch(SAME_EMAIL_QUERY, {
      ids: [id, getDraftId(id)],
      email: normalizeEmail(email),
    }),
  );
  return count === 0 ? true : 'Another board member already uses this email';
};

export const boardMember = defineType({
  name: 'boardMember',
  title: 'Board member',
  type: 'document',
  icon: IdentificationBadge,
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: required }),
    defineField({ name: 'role', title: 'Role on the board', type: 'localeString', validation: required }),
    defineField({ name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true }, validation: required }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'email',
      validation: (rule) => rule.required().custom(uniqueEmail),
    }),
    defineField({
      name: 'phone',
      title: 'Phone',
      type: 'string',
      description: '8 digits, for example 91234567',
      validation: (rule) => rule.regex(/^\d{8}$/, { name: 'phone' }),
    }),
    order,
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'role.nb', media: 'photo' } },
});

const STATUS_TITLES: Record<GroupStatus, string> = {
  [GroupStatus.enum.open]: 'Open for new members',
  [GroupStatus.enum.waitlist]: 'Waiting list',
  [GroupStatus.enum.full]: 'Full, no new members',
};

const fixedKey = (values: readonly string[]) =>
  defineField({ name: 'key', type: 'string', readOnly: true, hidden: true, options: options(values) });

export const trainingGroup = defineType({
  name: 'trainingGroup',
  title: 'Training group',
  type: 'document',
  icon: UsersThree,
  fields: [
    fixedKey(Group.options),
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: required }),
    defineField({
      name: 'who',
      title: 'Who it is for',
      type: 'localeText',
      description: 'Shown on the training page.',
      validation: required,
    }),
    defineField({ name: 'coached', title: 'With a coach', type: 'boolean', initialValue: false }),
    defineField({
      name: 'status',
      title: 'New members',
      type: 'string',
      options: {
        list: GroupStatus.options.map((value) => ({ title: STATUS_TITLES[value], value })),
        layout: 'radio',
      },
      initialValue: GroupStatus.enum.open,
      validation: required,
    }),
    defineField({
      name: 'statusNote',
      title: 'Note about new members',
      type: 'localeText',
      description: 'Optional. For example "We take new players again in January."',
      hidden: ({ document }) => document?.status === GroupStatus.enum.open,
    }),
  ],
  preview: {
    select: { title: 'name.nb', status: 'status' },
    prepare: ({ title, status }: Record<string, string | undefined>) => {
      const known = GroupStatus.safeParse(status);
      return { title, subtitle: known.success ? STATUS_TITLES[known.data] : undefined };
    },
  },
});

export const volunteerTeam = defineType({
  name: 'volunteerTeam',
  title: 'Volunteer team',
  type: 'document',
  icon: HandHeart,
  fields: [
    fixedKey(Team.options),
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: required }),
    defineField({
      name: 'what',
      title: 'What the team does',
      type: 'localeText',
      description: 'Shown when members sign up for shifts.',
      validation: required,
    }),
  ],
  preview: { select: { title: 'name.nb', subtitle: 'what.nb' } },
});

const SponsorTab = z.enum(['basics', 'strip', 'deal']);

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  icon: Handshake,
  groups: [
    { name: SponsorTab.enum.basics, title: 'Basics', default: true },
    { name: SponsorTab.enum.strip, title: 'Partner strip' },
    { name: SponsorTab.enum.deal, title: 'Member deal' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', group: SponsorTab.enum.basics, validation: required }),
    defineField({
      name: 'logo',
      group: SponsorTab.enum.basics,
      title: 'Logo',
      type: 'image',
      description: 'A wide logo works best. SVG or PNG with a see-through background.',
      validation: required,
    }),
    defineField({
      name: 'url',
      group: SponsorTab.enum.basics,
      title: 'Website',
      type: 'url',
      validation: (rule) => rule.required().uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'inStrip',
      group: SponsorTab.enum.strip,
      title: 'Show in the partner strip',
      type: 'boolean',
      description: 'The strip above the footer on every page.',
      initialValue: true,
    }),
    defineField({
      name: 'stripText',
      group: SponsorTab.enum.strip,
      title: 'Text in the partner strip',
      type: 'localeString',
      description: 'For example "Members get up to 20% off at Sport Modern."',
      hidden: ({ document }) => document?.inStrip === false,
      validation: (rule) =>
        rule.custom((text, { document }) => (document?.inStrip !== false && !text ? 'Required' : true)),
    }),
    defineField({
      name: 'deal',
      group: SponsorTab.enum.deal,
      title: 'Member deal',
      type: 'object',
      description: 'Optional. Shown on the membership page.',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: 'intro',
          title: 'Intro',
          type: 'localeString',
          description: 'For example "Our members get these discounts at Sport Modern."',
        }),
        defineField({
          name: 'perks',
          title: 'Perks',
          type: 'array',
          validation: (rule) => rule.max(4),
          of: [
            defineArrayMember({
              name: 'perk',
              type: 'object',
              fields: [
                defineField({
                  name: 'icon',
                  title: 'Icon',
                  type: 'string',
                  options: { list: PerkIcon.options.map((value) => ({ title: PERK_ICON_NAMES[value], value })) },
                  initialValue: PerkIcon.enum.tag,
                  validation: required,
                }),
                defineField({
                  name: 'value',
                  title: 'Big text',
                  type: 'localeString',
                  description: 'For example "20 %" or "Free shipping".',
                  validation: required,
                }),
                defineField({
                  name: 'label',
                  title: 'Small text',
                  type: 'localeString',
                  description: 'For example "off clothes and rackets".',
                  validation: required,
                }),
              ],
              preview: { select: { title: 'value.nb', subtitle: 'label.nb' } },
            }),
          ],
        }),
        defineField({
          name: 'howTo',
          title: 'How to use it',
          type: 'localeString',
          description: 'For example "Give the club code when you order."',
        }),
        defineField({
          name: 'askForCode',
          title: 'Show an "Ask for the code" button',
          type: 'boolean',
          initialValue: false,
        }),
      ],
    }),
    { ...order, group: SponsorTab.enum.basics },
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'url', media: 'logo' } },
});
