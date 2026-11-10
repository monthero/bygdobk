import { describe, expect, it } from 'vite-plus/test';

import { LOCALES, LOCALES_BY_ORDER } from '~/i18n/locales';

import { NodeKind, type FieldNode } from './missing';
import { fieldJobs } from './translate';

const localized = (name: string): FieldNode => ({ kind: NodeKind.enum.localized, name, title: name });

const NODES: FieldNode[] = [
  localized('title'),
  localized('body'),
  { kind: NodeKind.enum.object, name: 'seo', title: 'SEO', children: [localized('description')] },
  { kind: NodeKind.enum.array, name: 'sections', title: 'Sections', children: [localized('heading')] },
];

const BLOCK = {
  _type: 'block',
  _key: 'b',
  markDefs: [],
  children: [{ _type: 'span', _key: 's', text: 'Hello', marks: [] }],
};

const summary = (doc: unknown) =>
  fieldJobs(NODES, doc).map(({ path, source, targets, plan }) => ({ path, source, targets, items: plan.items }));

describe('fieldJobs', () => {
  it('translates from Norwegian and only fills empty languages', () => {
    const doc = { title: { nb: 'Hei', en: 'Hello', sv: '', da: 'Hej' } };
    expect(summary(doc)).toEqual([
      { path: 'title', source: 'nb', targets: ['sv', 'fi', 'is', 'zh'], items: [{ text: 'Hei', html: false }] },
    ]);
  });

  it('falls back to English and skips fields with neither', () => {
    const doc = { body: { en: [BLOCK] }, seo: { description: { sv: 'Hej' } } };
    expect(summary(doc)).toEqual([
      {
        path: 'body',
        source: 'en',
        targets: LOCALES_BY_ORDER.filter((locale) => locale !== 'en'),
        items: [{ text: '<div>Hello</div>', html: true }],
      },
    ]);
  });

  it('builds key and index paths into arrays and leaves text with only spaces alone', () => {
    const heading = { nb: '  ', en: 'Hi', sv: 'Hej', da: 'Hej', fi: 'Hei', is: 'Hæ' };
    const doc = { sections: [{ _key: 'a', heading }, { heading }] };
    expect(summary(doc).map(({ path, source, targets }) => ({ path, source, targets }))).toEqual([
      { path: 'sections[_key=="a"].heading', source: 'en', targets: ['zh'] },
      { path: 'sections[1].heading', source: 'en', targets: ['zh'] },
    ]);
  });

  it('returns nothing when every language is filled', () => {
    const title = Object.fromEntries(LOCALES.map((locale) => [locale, 'x']));
    expect(summary({ title })).toEqual([]);
  });
});
