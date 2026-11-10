import { describe, expect, it } from 'vite-plus/test';

import { blockToHtml, htmlToSpans, planBody, planValue } from './portableText';

const counter = () => {
  let next = 0;
  return () => `k${++next}`;
};

const identity = (texts: readonly { text: string }[]) => texts.map(({ text }) => text);

const span = (text: string, marks: string[] = []) => ({ _type: 'span' as const, _key: `s-${text}`, text, marks });

const LINK = { _key: 'link1', _type: 'link', href: 'https://bygdobk.no' };

const RICH_BLOCK = {
  _type: 'block',
  _key: 'b1',
  style: 'normal',
  listItem: 'bullet',
  level: 2,
  markDefs: [LINK],
  children: [span('Come to '), span('training', ['strong']), span(' at '), span('the hall', ['em', 'link1'])],
};

const HEADING = { _type: 'block', _key: 'b2', style: 'h2', markDefs: [], children: [span('Welcome')] };

const withoutKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(withoutKeys);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, inner]) => (key === '_key' ? [] : [[key, withoutKeys(inner)]])),
  );
};

describe('planBody', () => {
  it('round trips blocks with marks, links, lists and styles', () => {
    const body = [RICH_BLOCK, HEADING];
    const plan = planBody(body, counter());
    expect(plan.items).toEqual([
      {
        html: true,
        text: '<div>Come to <span data-m="strong">training</span> at <span data-m="em link1">the hall</span></div>',
      },
      { html: true, text: '<div>Welcome</div>' },
    ]);
    const rebuilt = plan.build(identity(plan.items));
    expect(withoutKeys(rebuilt)).toEqual(withoutKeys(body));
  });

  it('keeps markDef keys and gives blocks and spans new keys', () => {
    const plan = planBody([RICH_BLOCK], counter());
    const [block] = plan.build(identity(plan.items)) as (typeof RICH_BLOCK)[];
    expect(block?.markDefs).toEqual([LINK]);
    expect(block?._key).not.toBe(RICH_BLOCK._key);
    const keys = new Set([block?._key, ...(block?.children ?? []).map(({ _key }) => _key)]);
    expect(keys.size).toBe(1 + (block?.children.length ?? 0));
    for (const { _key } of RICH_BLOCK.children) expect(keys.has(_key)).toBe(false);
  });

  it('maps translated spans back, even when the order changes', () => {
    const plan = planBody([RICH_BLOCK], counter());
    const [block] = plan.build([
      '<div><span data-m="em link1">Hallen</span> har <span data-m="strong">trening</span> i dag</div>',
    ]) as (typeof RICH_BLOCK)[];
    expect(block?.children.map(({ text, marks }) => ({ text, marks }))).toEqual([
      { text: 'Hallen', marks: ['em', 'link1'] },
      { text: ' har ', marks: [] },
      { text: 'trening', marks: ['strong'] },
      { text: ' i dag', marks: [] },
    ]);
    expect(block).toMatchObject({ style: 'normal', listItem: 'bullet', level: 2 });
  });

  it('copies empty blocks without sending them', () => {
    const empty = { _type: 'block', _key: 'e', style: 'normal', markDefs: [], children: [span('  ')] };
    const plan = planBody([empty], counter());
    expect(plan.items).toEqual([]);
    expect(withoutKeys(plan.build([]))).toEqual(withoutKeys([empty]));
  });

  it('translates the text fields of callouts, quotes, tables and images', () => {
    const callout = { _type: 'callout', _key: 'c', title: 'Note', text: 'Bring shoes' };
    const quote = { _type: 'quote', _key: 'q', text: 'Play fair', cite: 'Kari Nordmann' };
    const table = {
      _type: 'table',
      _key: 't',
      caption: 'Prices',
      rows: [
        { _key: 'r1', cells: ['Group', 'Price'] },
        { _key: 'r2', cells: ['Junior', ''] },
      ],
    };
    const image = { _type: 'image', _key: 'i', asset: { _ref: 'image-abc' }, alt: 'Shuttle' };
    const plan = planBody([callout, quote, table, image], counter());
    expect(plan.items.map(({ text }) => text)).toEqual([
      'Note',
      'Bring shoes',
      'Play fair',
      'Prices',
      'Group',
      'Price',
      'Junior',
      'Shuttle',
    ]);
    expect(plan.items.every(({ html }) => !html)).toBe(true);
    const rebuilt = plan.build(plan.items.map(({ text }) => text.toUpperCase()));
    expect(withoutKeys(rebuilt)).toEqual([
      { _type: 'callout', title: 'NOTE', text: 'BRING SHOES' },
      { _type: 'quote', text: 'PLAY FAIR', cite: 'Kari Nordmann' },
      {
        _type: 'table',
        caption: 'PRICES',
        rows: [{ cells: ['GROUP', 'PRICE'] }, { cells: ['JUNIOR', ''] }],
      },
      { _type: 'image', asset: { _ref: 'image-abc' }, alt: 'SHUTTLE' },
    ]);
  });

  it('passes unknown block types through unchanged', () => {
    const custom = { _type: 'video', _key: 'v', url: 'https://example.com/clip', caption: 'Our match' };
    const inline = { _type: 'block', _key: 'x', markDefs: [], children: [{ _type: 'emoji', _key: 'm', name: 'tada' }] };
    const plan = planBody([custom, inline, 'odd'], counter());
    expect(plan.items).toEqual([]);
    expect(withoutKeys(plan.build([]))).toEqual(withoutKeys([custom, inline, 'odd']));
  });
});

describe('blockToHtml and htmlToSpans', () => {
  it('escapes markup and keeps line breaks', () => {
    const block = { _type: 'block' as const, children: [span('Fish & chips <3\nSecond line', ['strong'])] };
    const html = blockToHtml(block);
    expect(html).toBe('<div><span data-m="strong">Fish &amp; chips &lt;3<br>Second line</span></div>');
    expect(htmlToSpans(html, new Set(['strong']), counter())).toEqual([
      { _type: 'span', _key: 'k1', text: 'Fish & chips <3\nSecond line', marks: ['strong'] },
    ]);
  });

  it('decodes entities and drops marks the source block does not have', () => {
    const spans = htmlToSpans(
      `<div>It&#39;s <span data-m='strong bogus'>caf&#xE9;</span>&nbsp;time</div>`,
      new Set(['strong']),
      counter(),
    );
    expect(spans.map(({ text, marks }) => ({ text, marks }))).toEqual([
      { text: "It's ", marks: [] },
      { text: 'café', marks: ['strong'] },
      { text: ' time', marks: [] },
    ]);
  });

  it('merges nested and repeated tags into flat spans', () => {
    const spans = htmlToSpans(
      '<div><span data-m="strong"><span data-m="em">a</span>b</span><span data-m="strong">c</span></div>',
      new Set(['strong', 'em']),
      counter(),
    );
    expect(spans.map(({ text, marks }) => ({ text, marks }))).toEqual([
      { text: 'a', marks: ['strong', 'em'] },
      { text: 'bc', marks: ['strong'] },
    ]);
  });

  it('returns one empty span for an empty translation', () => {
    expect(htmlToSpans('<div></div>', new Set(), counter())).toEqual([
      { _type: 'span', _key: 'k1', text: '', marks: [] },
    ]);
  });
});

describe('planValue', () => {
  it('sends plain strings as plain text', () => {
    const plan = planValue('Hello', counter());
    expect(plan?.items).toEqual([{ text: 'Hello', html: false }]);
    expect(plan?.build(['Hei'])).toBe('Hei');
  });

  it('skips values that are neither text nor Portable Text', () => {
    expect(planValue(42)).toBeUndefined();
  });
});
