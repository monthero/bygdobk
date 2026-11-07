import { defineArrayMember, defineField, defineType, type CustomValidator } from 'sanity';
import { z } from 'zod';

import { Group, GroupStatus, PlanAudience, PriceKind } from '~/data/club';
import { ContactTopic, TOPIC_ID } from '~/data/contact';
import { allowsShifts, EventKind, Team } from '~/data/events';
import { InternalPath, NewsKind } from '~/data/news';
import { NoticeTone } from '~/data/notice';
import { SOCIAL_NAMES, SocialPlatform } from '~/data/socials';
import { PERK_ICON_NAMES, PerkIcon } from '~/data/sponsors';
import { weekdayName } from '~/utils/dates';

import { BannerInput } from './BannerInput';

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

const order = defineField({ name: 'order', title: 'Order', type: 'number', description: 'Lower comes first' });

const SettingsTab = z.enum(['club', 'notice', 'socials', 'payment', 'contact']);

type ContactTopicItem = { id?: string };

const topicIds: CustomValidator<ContactTopicItem[] | undefined> = (topics) => {
  const ids = (topics ?? []).map((topic) => topic.id);
  return new Set(ids).size === ids.length ? true : 'Each topic needs its own ID';
};

const builtInTopics: CustomValidator<ContactTopicItem[] | undefined> = (topics) => {
  const ids = new Set((topics ?? []).map((topic) => topic.id));
  const missing = ContactTopic.options.filter((id) => !ids.has(id));
  return missing.length === 0
    ? true
    : `Buttons on the site open these topics: ${missing.join(', ')}. Without them, they open the first topic.`;
};

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: SettingsTab.enum.club, title: 'Club', default: true },
    { name: SettingsTab.enum.notice, title: 'Notice' },
    { name: SettingsTab.enum.socials, title: 'Social links' },
    { name: SettingsTab.enum.payment, title: 'Payment' },
    { name: SettingsTab.enum.contact, title: 'Contact form' },
  ],
  fields: [
    defineField({
      name: 'club',
      title: 'Club details',
      description: 'Shown in the footer, the menu, on the contact page and on training and events.',
      type: 'object',
      group: SettingsTab.enum.club,
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'email',
          title: 'Board email',
          type: 'email',
          description: 'Shown on the site, and gets contact form messages unless a topic says otherwise.',
          validation: required,
        }),
        defineField({
          name: 'venue',
          title: 'Home hall',
          description: 'Where training happens. Events without their own venue are held here too.',
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: required }),
            defineField({ name: 'address', title: 'Address', type: 'string', validation: required }),
            defineField({
              name: 'mapUrl',
              title: 'Map link',
              type: 'url',
              description: 'Optional. Without it, the site opens the address in the visitor’s map app.',
            }),
          ],
        }),
        defineField({
          name: 'orgNr',
          title: 'Organization number',
          type: 'string',
          description: 'From the Brønnøysund Register Centre, for example 993 621 358.',
          validation: (rule) => rule.regex(/^\d{3} ?\d{3} ?\d{3}$/, { name: 'organization number' }),
        }),
        defineField({
          name: 'whistleblowingUrl',
          title: 'Whistleblowing link',
          type: 'url',
          description: 'Where members can report problems outside the club. Shown on the club page.',
          validation: (rule) => rule.uri({ scheme: ['https'] }),
        }),
      ],
    }),
    defineField({
      name: 'payment',
      title: 'Payment',
      description: 'Shown on the membership pages and on the front page.',
      type: 'object',
      group: SettingsTab.enum.payment,
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'vipps',
          title: 'Vipps number',
          type: 'string',
          description: 'Shown next to drop-in prices. Leave empty to hide it.',
          validation: (rule) => rule.regex(/^\d{4,6}$/, { name: 'Vipps number' }),
        }),
        defineField({
          name: 'accountNumber',
          title: 'Bank account number',
          type: 'string',
          description: 'Optional, for example 1234 56 78901.',
          validation: (rule) => rule.regex(/^\d{4} ?\d{2} ?\d{5}$/, { name: 'account number' }),
        }),
        defineField({
          name: 'instructions',
          title: 'How to pay',
          type: 'localeText',
          description: 'The "Pay" step on the membership page.',
          validation: required,
        }),
      ],
    }),
    defineField({
      name: 'contactTopics',
      title: 'Contact form topics',
      description: 'The list visitors pick from on the contact page, in this order.',
      type: 'array',
      group: SettingsTab.enum.contact,
      validation: (rule) => [rule.required().min(1).custom(topicIds), rule.custom(builtInTopics).warning()],
      of: [
        defineArrayMember({
          name: 'contactTopic',
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'localeString', validation: required }),
            defineField({
              name: 'id',
              title: 'ID',
              type: 'string',
              description: `Short and lowercase. Buttons on the site use these: ${ContactTopic.options.join(', ')}.`,
              validation: (rule) => rule.required().regex(TOPIC_ID, { name: 'ID' }),
            }),
            defineField({
              name: 'recipients',
              title: 'Send to',
              type: 'array',
              of: [defineArrayMember({ type: 'email' })],
              description: 'Leave empty to send to the board email.',
            }),
          ],
          preview: {
            select: { title: 'label.nb', id: 'id', recipients: 'recipients' },
            prepare: ({ title, id, recipients }: { title?: string; id?: string; recipients?: string[] }) => ({
              title,
              subtitle: [id, recipients?.length ? recipients.join(', ') : 'Board email'].join(' · '),
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'notice',
      title: 'Notice at the top of every page',
      type: 'object',
      group: SettingsTab.enum.notice,
      fields: [
        defineField({ name: 'visible', title: 'Show the notice', type: 'boolean', initialValue: false }),
        defineField({
          name: 'tone',
          title: 'Tone',
          type: 'string',
          options: { ...options(NoticeTone.options), layout: 'radio', direction: 'horizontal' },
          initialValue: NoticeTone.enum.info,
        }),
        defineField({ name: 'text', title: 'Text', type: 'localeText' }),
      ],
    }),
    defineField({
      name: 'socials',
      title: 'Social links',
      description: 'Shown in the footer, the menu and on the contact page, in this order.',
      type: 'array',
      group: SettingsTab.enum.socials,
      of: [
        defineArrayMember({
          name: 'social',
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: { list: SocialPlatform.options.map((value) => ({ title: SOCIAL_NAMES[value], value })) },
              validation: required,
            }),
            defineField({
              name: 'url',
              title: 'Link',
              type: 'url',
              validation: (rule) => rule.required().uri({ scheme: ['https'] }),
            }),
          ],
          preview: {
            select: { platform: 'platform', url: 'url' },
            prepare: ({ platform, url }: Record<string, string | undefined>) => {
              const known = SocialPlatform.safeParse(platform);
              return { title: known.success ? SOCIAL_NAMES[known.data] : platform, subtitle: url };
            },
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
});

export const privacyPage = defineType({
  name: 'privacyPage',
  title: 'Privacy',
  type: 'document',
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
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'localeString', validation: required }),
    slug('title.nb'),
    defineField({ name: 'date', title: 'Date', type: 'date', validation: required }),
    defineField({
      name: 'kind',
      title: 'Category',
      type: 'string',
      options: options(NewsKind.options),
      validation: required,
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'localeText', validation: required }),
    defineField({
      name: 'banner',
      title: 'Banner image',
      type: 'image',
      description:
        "Optional. A wide photo shown behind the title and on news cards. Without it, the site uses one of the club's photos. Posters and other images go in the article.",
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
    }),
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

export const event = defineType({
  name: 'event',
  title: 'Calendar event',
  type: 'document',
  fields: [
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      options: { ...options(EventKind.options), layout: 'radio', direction: 'horizontal' },
      validation: required,
    }),
    defineField({
      name: 'group',
      title: 'Training group',
      type: 'string',
      options: options(Group.options),
      hidden: (ctx) => !isTraining(ctx),
      validation: (rule) => rule.custom(requiredFor(forTraining)),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localeString',
      hidden: isTraining,
      validation: (rule) => rule.custom(requiredFor(notTraining)),
    }),
    defineField({
      name: 'slug',
      title: 'URL name',
      type: 'slug',
      options: { source: 'title.nb' },
      hidden: isPlain,
      validation: (rule) =>
        rule.custom(requiredFor((doc) => doc.kind !== EventKind.enum.training && doc.kind !== EventKind.enum.break)),
    }),
    defineField({ name: 'startDate', title: 'First day', type: 'date', validation: required }),
    defineField({
      name: 'endDate',
      title: 'Last day',
      type: 'date',
      description: 'Leave empty for a one-day event.',
      hidden: isTraining,
      validation: (rule) =>
        rule.custom((end: string | undefined, { document }) => {
          const start = (document as EventDoc | undefined)?.startDate;
          return !end || !start || end >= start ? true : 'The last day must be on or after the first day';
        }),
    }),
    defineField({
      name: 'dateConfirmed',
      title: 'The date is set',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off while the date is not decided. The first day is then only used to sort.',
      hidden: isPlain,
    }),
    defineField({
      name: 'whenText',
      title: 'When, in words',
      type: 'localeString',
      description: 'For example "Spring 2027, date to be announced".',
      hidden: isPlain,
      validation: (rule) =>
        rule.custom(requiredFor((doc) => doc.dateConfirmed === false, 'Say roughly when, while the date is not set')),
    }),
    time('startTime', 'Starts at', false),
    time('endTime', 'Ends at', false),
    defineField({
      name: 'recurrence',
      title: 'Repeats every week',
      type: 'object',
      description: 'Training repeats on these days, from the first day until the last.',
      validation: (rule) => rule.custom(requiredFor(forTraining)),
      fields: [
        defineField({
          name: 'weekdays',
          title: 'On',
          type: 'array',
          of: [defineArrayMember({ type: 'number' })],
          options: { list: ISO_WEEKDAYS.map((value) => ({ title: weekdayName(value), value })), layout: 'grid' },
          validation: (rule) => rule.required().min(1),
        }),
        defineField({ name: 'until', title: 'Until', type: 'date', validation: required }),
      ],
    }),
    defineField({
      name: 'groups',
      title: 'Only for these groups',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { list: options(Group.options).list, layout: 'grid' },
      description: 'Leave empty if it is for everyone. Training of these groups is off while it happens.',
      hidden: isTraining,
    }),
    defineField({ name: 'description', title: 'Description', type: 'localeText', hidden: isTraining }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'object',
      description: 'Leave empty if it is in the home hall from Site settings. A trip always needs a venue.',
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
      name: 'registrationDeadline',
      title: 'Registration deadline',
      type: 'datetime',
      hidden: isPlain,
    }),
    defineField({
      name: 'registrationUrl',
      title: 'Registration link',
      type: 'url',
      description: "Where people sign up, for example the organizer's tournament system.",
      hidden: isPlain,
    }),
    defineField({
      name: 'ownEvent',
      title: 'Organized by the club',
      type: 'boolean',
      initialValue: false,
      hidden: isPlain,
    }),
    defineField({
      name: 'tip',
      title: 'Tip box',
      type: 'object',
      hidden: isPlain,
      fields: [
        defineField({ name: 'title', title: 'Title', type: 'localeString' }),
        defineField({ name: 'text', title: 'Text', type: 'localeText' }),
      ],
    }),
    defineField({
      name: 'signupUrl',
      title: 'Sign-up link',
      type: 'url',
      description:
        'Optional. An outside sign-up sheet, for example a Google Sheet, shown as an extra button. Members can always sign up for shifts on the website.',
      hidden: noShifts,
    }),
    defineField({
      name: 'shifts',
      title: 'Volunteer shifts',
      type: 'array',
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
              options: options(Team.options),
              validation: required,
            }),
            defineField({ name: 'day', title: 'Day', type: 'date', validation: required }),
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
            select: { team: 'team', day: 'day', start: 'start', end: 'end' },
            prepare: ({ team, day, start, end }: Record<string, string | undefined>) => ({
              title: `${team ?? ''} ${start ?? ''}${end ? `–${end}` : ''}`,
              subtitle: day,
            }),
          },
        }),
      ],
    }),
  ],
  validation: (rule) =>
    rule.custom((document) => {
      const doc = document as (EventDoc & { startTime?: string; endTime?: string }) | undefined;
      if (doc?.kind !== EventKind.enum.training) return true;
      return doc.startTime && doc.endTime ? true : 'Training needs a start and end time';
    }),
  orderings: [{ title: 'Newest first', name: 'startDesc', by: [{ field: 'startDate', direction: 'desc' }] }],
  preview: {
    select: {
      kind: 'kind',
      title: 'title.nb',
      group: 'group',
      start: 'startDate',
      startTime: 'startTime',
      endTime: 'endTime',
    },
    prepare: ({ kind, title, group, start, startTime, endTime }: Record<string, string | undefined>) => ({
      title: kind === EventKind.enum.training ? `${group ?? ''} ${startTime ?? ''}–${endTime ?? ''}` : (title ?? ''),
      subtitle: [kind, start].filter(Boolean).join(' · '),
    }),
  },
});

export const membershipPlan = defineType({
  name: 'membershipPlan',
  title: 'Membership plan',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'localeString', validation: required }),
    slug('name.nb'),
    defineField({
      name: 'kind',
      title: 'Type',
      type: 'string',
      options: options(PriceKind.options),
      validation: required,
    }),
    defineField({
      name: 'audience',
      title: 'Who can pick it',
      type: 'string',
      options: {
        list: [
          { title: 'Adults', value: PlanAudience.enum.adult },
          { title: 'Children', value: PlanAudience.enum.child },
          { title: 'Everyone', value: PlanAudience.enum.all },
        ],
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
      options: options(Group.options),
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
  preview: { select: { title: 'name.nb', subtitle: 'kind' } },
});

export const discount = defineType({
  name: 'discount',
  title: 'Discount',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'localeString', validation: required }),
    defineField({ name: 'body', title: 'Text', type: 'localeText', validation: required }),
    order,
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title.nb', subtitle: 'body.nb' } },
});

export const boardMember = defineType({
  name: 'boardMember',
  title: 'Board member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: required }),
    defineField({ name: 'role', title: 'Role on the board', type: 'localeString', validation: required }),
    defineField({ name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true }, validation: required }),
    defineField({ name: 'email', title: 'Email', type: 'email', validation: required }),
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

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: required }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'A wide logo works best. SVG or PNG with a see-through background.',
      validation: required,
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      validation: (rule) => rule.required().uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'inStrip',
      title: 'Show in the partner strip',
      type: 'boolean',
      description: 'The strip above the footer on every page.',
      initialValue: true,
    }),
    defineField({
      name: 'stripText',
      title: 'Text in the partner strip',
      type: 'localeString',
      description: 'For example "Members get up to 20% off at Sport Modern."',
      hidden: ({ document }) => document?.inStrip === false,
      validation: (rule) =>
        rule.custom((text, { document }) => (document?.inStrip !== false && !text ? 'Required' : true)),
    }),
    defineField({
      name: 'deal',
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
    order,
  ],
  orderings: [{ title: 'Order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'name', subtitle: 'url', media: 'logo' } },
});
