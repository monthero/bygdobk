import { defineArrayMember, defineField, defineType, type CustomValidator } from 'sanity';

import { EnvelopeSimple, Info, Megaphone, ShareNetwork, Wallet } from '~/components/ui/icons';
import { ContactTopic, TOPIC_ID } from '~/data/contact';
import { NoticeTone } from '~/data/notice';
import { SOCIAL_NAMES, SocialPlatform } from '~/data/socials';

const required = <R extends { required: () => R }>(rule: R) => rule.required();

const NOTICE_TONES: Record<NoticeTone, string> = {
  [NoticeTone.enum.info]: 'Info (normal news)',
  [NoticeTone.enum.warning]: 'Warning (yellow, for important news)',
};

export const notice = defineType({
  name: 'notice',
  title: 'Notice banner',
  type: 'document',
  icon: Megaphone,
  description: 'A short message at the top of every page.',
  fields: [
    defineField({
      name: 'visible',
      title: 'Show the notice',
      type: 'boolean',
      description: 'Turn it off when it is out of date. The text stays for next time.',
      initialValue: false,
    }),
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      options: {
        list: NoticeTone.options.map((value) => ({ title: NOTICE_TONES[value], value })),
        layout: 'radio',
      },
      initialValue: NoticeTone.enum.info,
    }),
    defineField({
      name: 'text',
      title: 'Text',
      type: 'localeText',
      description: 'One or two sentences, for example "No training during the fall break, 29 September to 1 October."',
    }),
  ],
  preview: {
    select: { visible: 'visible', text: 'text.nb' },
    prepare: ({ visible, text }: { visible?: boolean; text?: string }) => ({
      title: 'Notice banner',
      subtitle: visible ? `Showing: ${text ?? ''}` : 'Hidden',
    }),
  },
});

export const socialLinks = defineType({
  name: 'socialLinks',
  title: 'Social links',
  type: 'document',
  icon: ShareNetwork,
  fields: [
    defineField({
      name: 'links',
      title: 'Links',
      description: 'Shown in the footer, the menu and on the contact page. Drag them into the order you want.',
      type: 'array',
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
              description: 'The full address, starting with https://',
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
  preview: { prepare: () => ({ title: 'Social links' }) },
});

export const clubDetails = defineType({
  name: 'clubDetails',
  title: 'Club details',
  type: 'document',
  icon: Info,
  description: 'Shown in the footer, the menu, on the contact page and on training and events.',
  fields: [
    defineField({
      name: 'email',
      title: 'Board email',
      type: 'email',
      description: 'Shown on the site. It also gets contact form messages, unless a topic says otherwise.',
      validation: required,
    }),
    defineField({
      name: 'venue',
      title: 'Home hall',
      description: 'Where training happens. Training and events without their own venue are held here.',
      type: 'object',
      options: { collapsible: false },
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
    defineField({
      name: 'spondCode',
      title: 'Spond group code',
      type: 'string',
      description:
        'The code people type in the Spond app (Groups, then Enter code) to ask to join the club group. Shown on the training page.',
      validation: (rule) => rule.regex(/^[A-Za-z0-9]{4,8}$/, { name: 'group code' }),
    }),
  ],
  preview: { prepare: () => ({ title: 'Club details' }) },
});

export const payment = defineType({
  name: 'payment',
  title: 'Payment',
  type: 'document',
  icon: Wallet,
  description: 'Shown on the membership pages and on the front page.',
  fields: [
    defineField({
      name: 'vipps',
      title: 'Vipps number',
      type: 'string',
      description: 'Shown next to the drop-in price. Leave it empty to hide it.',
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
  preview: { prepare: () => ({ title: 'Payment' }) },
});

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

export const contactForm = defineType({
  name: 'contactForm',
  title: 'Contact form',
  type: 'document',
  icon: EnvelopeSimple,
  fields: [
    defineField({
      name: 'topics',
      title: 'Topics',
      description: 'What visitors pick from on the contact page. The first one is picked at the start.',
      type: 'array',
      validation: (rule) => [rule.required().min(1).custom(topicIds), rule.custom(builtInTopics).warning()],
      of: [
        defineArrayMember({
          name: 'contactTopic',
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'localeString', validation: required }),
            defineField({
              name: 'recipients',
              title: 'Send to',
              type: 'array',
              of: [defineArrayMember({ type: 'email' })],
              description: 'Leave it empty to send to the board email in Club details.',
            }),
            defineField({
              name: 'id',
              title: 'ID',
              type: 'string',
              description: `Short and lowercase, for example "kiosk". Buttons on the site use these: ${ContactTopic.options.join(', ')}.`,
              validation: (rule) => rule.required().regex(TOPIC_ID, { name: 'ID' }),
            }),
          ],
          preview: {
            select: { title: 'label.nb', recipients: 'recipients' },
            prepare: ({ title, recipients }: { title?: string; recipients?: string[] }) => ({
              title,
              subtitle: recipients?.length ? `To ${recipients.join(', ')}` : 'To the board email',
            }),
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Contact form' }) },
});

export const SETTINGS_TYPES = [notice, socialLinks, clubDetails, payment, contactForm];
