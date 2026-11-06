import { defineArrayMember, defineField, defineType, type Rule } from 'sanity';

import { CONTENT_FALLBACK, LOCALE_META, LOCALES_BY_ORDER, REQUIRED_LOCALES } from '~/i18n/locales';

const TRANSLATIONS = 'translations';

const localized = (name: string, title: string, type: string, rows?: number) =>
  defineType({
    name,
    title,
    type: 'object',
    fieldsets: [{ name: TRANSLATIONS, title: 'Translations', options: { collapsible: true, collapsed: true } }],
    fields: LOCALES_BY_ORDER.map((locale) =>
      defineField({
        name: locale,
        title: LOCALE_META[locale].name,
        type,
        ...(rows && { rows }),
        ...(REQUIRED_LOCALES.has(locale)
          ? { validation: (rule: Rule) => rule.required() }
          : {
              fieldset: TRANSLATIONS,
              description: `Optional. ${LOCALE_META[CONTENT_FALLBACK[locale]].name} is shown when empty.`,
            }),
      }),
    ),
  });

export const localeString = localized('localeString', 'Text', 'string');

export const localeText = localized('localeText', 'Text', 'text', 3);

export const callout = defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'text', type: 'text', rows: 3, validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'title', subtitle: 'text' } },
});

export const quote = defineType({
  name: 'quote',
  title: 'Quote',
  type: 'object',
  fields: [
    defineField({ name: 'text', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: 'cite', title: 'Who said it', type: 'string' }),
  ],
  preview: { select: { title: 'text', subtitle: 'cite' } },
});

export const table = defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({
      name: 'rows',
      title: 'Rows',
      description: 'The first row is the header.',
      type: 'array',
      validation: (rule) => rule.required().min(2),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tableRow',
          fields: [
            defineField({ name: 'cells', title: 'Cells', type: 'array', of: [defineArrayMember({ type: 'string' })] }),
          ],
          preview: {
            select: { cells: 'cells' },
            prepare: ({ cells }: { cells?: string[] }) => ({ title: (cells ?? []).join(' · ') }),
          },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'caption' }, prepare: ({ title }: { title?: string }) => ({ title: title ?? 'Table' }) },
});

export const articleBody = defineType({
  name: 'articleBody',
  title: 'Article',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Paragraph', value: 'normal' },
        { title: 'Heading', value: 'h2' },
      ],
      lists: [{ title: 'Bullets', value: 'bullet' }],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
      },
    }),
    defineArrayMember({ type: 'callout' }),
    defineArrayMember({ type: 'quote' }),
    defineArrayMember({ type: 'table' }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Describe the image', type: 'string' })],
    }),
  ],
});

export const localeBody = localized('localeBody', 'Article', 'articleBody');
