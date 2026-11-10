import { z } from 'zod';

import type { TranslateItem } from './request';

export type NewKey = () => string;

export const randomKey: NewKey = () => crypto.randomUUID().replaceAll('-', '').slice(0, 12);

const Span = z.looseObject({
  _type: z.literal('span'),
  _key: z.string().optional(),
  text: z.string(),
  marks: z.array(z.string()).optional(),
});
type Span = z.infer<typeof Span>;

const Block = z.looseObject({
  _type: z.literal('block'),
  children: z.array(Span),
  markDefs: z.array(z.looseObject({ _key: z.string() })).optional(),
});
type Block = z.infer<typeof Block>;

const Keyed = z.looseObject({ _type: z.string(), _key: z.string().optional() });

const TableRow = z.looseObject({ cells: z.array(z.string()).optional() });
const Table = z.looseObject({ _type: z.literal('table'), caption: z.string().optional(), rows: z.array(TableRow) });

const TEXT_FIELDS: Record<string, readonly string[]> = {
  callout: ['title', 'text'],
  quote: ['text'],
  image: ['alt'],
};

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const ENTITY = /&(#x[\da-f]+|#\d+|[a-z]+);/gi;
const TAG_OR_TEXT = /<(\/?)([a-z][\w-]*)([^>]*)>|([^<]+)/gi;
const MARKS_ATTRIBUTE = /data-m\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
const VOID_TAGS = new Set(['br', 'wbr', 'img', 'hr']);
const LINE_BREAK = 'br';

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>');

const decodeEntity = (match: string, name: string) => {
  if (name.startsWith('#x') || name.startsWith('#X')) return String.fromCodePoint(Number.parseInt(name.slice(2), 16));
  if (name.startsWith('#')) return String.fromCodePoint(Number.parseInt(name.slice(1), 10));
  return ENTITIES[name.toLowerCase()] ?? match;
};

const decodeHtml = (text: string) => text.replaceAll(ENTITY, decodeEntity);

const spanHtml = ({ text, marks }: Span) => {
  const escaped = escapeHtml(text);
  return marks?.length ? `<span data-m="${marks.join(' ')}">${escaped}</span>` : escaped;
};

export const blockToHtml = (block: Block) => `<div>${block.children.map(spanHtml).join('')}</div>`;

const sameMarks = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((mark, i) => mark === b[i]);

export const htmlToSpans = (html: string, known: ReadonlySet<string>, newKey: NewKey): Span[] => {
  const stack: string[][] = [];
  const spans: Span[] = [];
  const append = (text: string) => {
    const marks = Array.from(new Set(stack.flat().filter((mark) => known.has(mark))));
    const last = spans.at(-1);
    if (last && sameMarks(last.marks ?? [], marks)) last.text += text;
    else spans.push({ _type: 'span', _key: newKey(), text, marks });
  };
  for (const [, closing, tag = '', attributes = '', text] of html.matchAll(TAG_OR_TEXT)) {
    if (text !== undefined) append(decodeHtml(text));
    else if (tag.toLowerCase() === LINE_BREAK) append('\n');
    else if (closing) stack.pop();
    else if (!VOID_TAGS.has(tag.toLowerCase()) && !attributes.trimEnd().endsWith('/')) {
      const found = MARKS_ATTRIBUTE.exec(attributes);
      stack.push((found?.[1] ?? found?.[2] ?? '').split(/\s+/).filter(Boolean));
    }
  }
  return spans.length > 0 ? spans : [{ _type: 'span', _key: newKey(), text: '', marks: [] }];
};

type Build = (out: readonly string[]) => unknown;

type Add = (item: TranslateItem) => number;

const textAt = (out: readonly string[], index: number) => out[index] ?? '';

const planText = (value: unknown, add: Add) => {
  if (typeof value !== 'string' || value.trim().length === 0) return () => value;
  const index = add({ text: value, html: false });
  return (out: readonly string[]) => textAt(out, index);
};

const planBlock = (block: Block, add: Add, newKey: NewKey): Build => {
  const keyed = () => ({
    ...block,
    _key: newKey(),
    children: block.children.map((span) => ({ ...span, _key: newKey() })),
  });
  if (block.children.every(({ text }) => text.trim().length === 0)) return keyed;
  const known = new Set(block.children.flatMap(({ marks }) => marks ?? []));
  const index = add({ text: blockToHtml(block), html: true });
  return (out) => ({ ...block, _key: newKey(), children: htmlToSpans(textAt(out, index), known, newKey) });
};

const planFields = (node: Record<string, unknown>, fields: readonly string[], add: Add, newKey: NewKey) => {
  const builds = fields.map((field) => [field, planText(node[field], add)] as const);
  return (out: readonly string[]) => {
    const copy: Record<string, unknown> = { ...node, _key: newKey() };
    for (const [field, build] of builds) if (node[field] !== undefined) copy[field] = build(out);
    return copy;
  };
};

const planTable = (table: z.infer<typeof Table>, add: Add, newKey: NewKey): Build => {
  const caption = planFields(table, ['caption'], add, newKey);
  const rows = table.rows.map((row) => ({ row, cells: (row.cells ?? []).map((cell) => planText(cell, add)) }));
  return (out) => ({
    ...caption(out),
    rows: rows.map(({ row, cells }) => (row.cells ? { ...row, cells: cells.map((build) => build(out)) } : row)),
  });
};

const planNode = (node: unknown, add: Add, newKey: NewKey): Build => {
  const block = Block.safeParse(node);
  if (block.success) return planBlock(block.data, add, newKey);
  const table = Table.safeParse(node);
  if (table.success) return planTable(table.data, add, newKey);
  const keyed = Keyed.safeParse(node);
  if (!keyed.success) return () => node;
  return planFields(keyed.data, TEXT_FIELDS[keyed.data._type] ?? [], add, newKey);
};

export type Plan = { items: TranslateItem[]; build: Build };

export const planBody = (body: readonly unknown[], newKey: NewKey = randomKey): Plan => {
  const items: TranslateItem[] = [];
  const add: Add = (item) => items.push(item) - 1;
  const builds = body.map((node) => planNode(node, add, newKey));
  return { items, build: (out) => builds.map((build) => build(out)) };
};

export const planValue = (value: unknown, newKey: NewKey = randomKey): Plan | undefined => {
  if (Array.isArray(value)) return planBody(value, newKey);
  if (typeof value !== 'string') return undefined;
  const items: TranslateItem[] = [];
  const build = planText(value, (item) => items.push(item) - 1);
  return { items, build };
};
