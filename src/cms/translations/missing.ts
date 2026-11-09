import {
  isArraySchemaType,
  isObjectSchemaType,
  type ObjectSchemaType,
  type PreviewValue,
  type SchemaType,
} from 'sanity';
import { z } from 'zod';

import { LOCALES_BY_ORDER, REQUIRED_LOCALES, type Locale } from '~/i18n/locales';

const LOCALIZED_TYPES = new Set(['localeString', 'localeText', 'localeBody']);
const MAX_DEPTH = 6;

const NodeKind = z.enum(['localized', 'object', 'array']);

type FieldNode =
  | { kind: typeof NodeKind.enum.localized; name: string; title: string }
  | {
      kind: typeof NodeKind.enum.object | typeof NodeKind.enum.array;
      name: string;
      title: string;
      children: FieldNode[];
    };

const isLocalized = (type: SchemaType | undefined): boolean =>
  type ? LOCALIZED_TYPES.has(type.name) || isLocalized(type.type) : false;

const mergeByName = (nodes: FieldNode[]) => Array.from(new Map(nodes.map((node) => [node.name, node])).values());

const nodesOf = (type: SchemaType, depth: number): FieldNode[] => {
  if (depth > MAX_DEPTH || !isObjectSchemaType(type)) return [];
  return type.fields.flatMap(({ name, type: fieldType }): FieldNode[] => {
    const title = fieldType.title ?? name;
    if (isLocalized(fieldType)) return [{ kind: NodeKind.enum.localized, name, title }];
    if (isObjectSchemaType(fieldType)) {
      const children = nodesOf(fieldType, depth + 1);
      return children.length > 0 ? [{ kind: NodeKind.enum.object, name, title, children }] : [];
    }
    if (isArraySchemaType(fieldType)) {
      const children = mergeByName(fieldType.of.flatMap((member) => nodesOf(member, depth + 1)));
      return children.length > 0 ? [{ kind: NodeKind.enum.array, name, title, children }] : [];
    }
    return [];
  });
};

const LOCALE_FLAGS = `{ ${LOCALES_BY_ORDER.map((locale) => `"${locale}": length(${locale}) > 0`).join(', ')} }`;

const projectionOf = (nodes: FieldNode[]): string =>
  nodes
    .map((node) => {
      switch (node.kind) {
        case NodeKind.enum.localized:
          return `"${node.name}": ${node.name}${LOCALE_FLAGS}`;
        case NodeKind.enum.object:
          return `"${node.name}": ${node.name}{ ${projectionOf(node.children)} }`;
        case NodeKind.enum.array:
          return `"${node.name}": ${node.name}[]{ ${projectionOf(node.children)} }`;
      }
    })
    .join(', ');

const groqPath = (path: string) =>
  path
    .split('.')
    .map((segment, i) => {
      if (/^\d+$/.test(segment)) return `[${segment}]`;
      return i === 0 ? segment : `.${segment}`;
    })
    .join('');

const previewProjection = (type: ObjectSchemaType) =>
  Object.entries(type.preview?.select ?? {})
    .map(([key, path]) => `"${key}": ${groqPath(path)}`)
    .join(', ');

export type TranslatedType = { type: ObjectSchemaType; nodes: FieldNode[] };

export const translatedTypes = (types: SchemaType[]): TranslatedType[] =>
  types.flatMap((type) => {
    if (!isObjectSchemaType(type)) return [];
    const nodes = nodesOf(type, 0);
    return nodes.length > 0 ? [{ type, nodes }] : [];
  });

export const missingTranslationsQuery = (types: TranslatedType[]) => {
  const branches = types.map(
    ({ type, nodes }) =>
      `_type == "${type.name}" => { "preview": { ${previewProjection(type)} }, "fields": { ${projectionOf(nodes)} } }`,
  );
  return `*[_type in $types] | order(_updatedAt desc) { _id, _type, ...select(${branches.join(', ')}) }`;
};

export const RawDoc = z.object({
  _id: z.string(),
  _type: z.string(),
  preview: z.record(z.string(), z.unknown()).nullish(),
  fields: z.record(z.string(), z.unknown()).nullish(),
});
export type RawDoc = z.infer<typeof RawDoc>;

type FieldGap = { field: string; locales: Locale[] };

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;

const collectGaps = (nodes: FieldNode[], value: unknown, trail: string[], gaps: FieldGap[]) => {
  const record = asRecord(value);
  if (!record) return;
  for (const node of nodes) {
    const field = record[node.name];
    const path = [...trail, node.title];
    if (node.kind === NodeKind.enum.localized) {
      const flags = asRecord(field);
      if (!flags || !LOCALES_BY_ORDER.some((locale) => flags[locale] === true)) continue;
      const locales = LOCALES_BY_ORDER.filter((locale) => flags[locale] !== true);
      if (locales.length > 0) gaps.push({ field: path.join(' › '), locales });
    } else if (node.kind === NodeKind.enum.object) {
      collectGaps(node.children, field, path, gaps);
    } else if (Array.isArray(field)) {
      for (const item of field) collectGaps(node.children, item, path, gaps);
    }
  }
};

export type RequiredGap = { locale: Locale; fields: string[] };

export type DocGaps = {
  id: string;
  type: ObjectSchemaType;
  preview: PreviewValue;
  required: RequiredGap[];
  optional: Locale[];
};

const preparePreview = (type: ObjectSchemaType, selection: Record<string, unknown>): PreviewValue => {
  const { prepare } = type.preview ?? {};
  if (!prepare) return selection;
  try {
    return prepare(selection);
  } catch {
    return { title: type.title };
  }
};

export const gapsOf = (doc: RawDoc, translated: TranslatedType, id: string): DocGaps | undefined => {
  const gaps: FieldGap[] = [];
  collectGaps(translated.nodes, doc.fields, [], gaps);
  if (gaps.length === 0) return undefined;
  const required = LOCALES_BY_ORDER.flatMap((locale): RequiredGap[] => {
    if (!REQUIRED_LOCALES.has(locale)) return [];
    const fields = gaps.filter((gap) => gap.locales.includes(locale)).map((gap) => gap.field);
    return fields.length > 0 ? [{ locale, fields }] : [];
  });
  const optional = LOCALES_BY_ORDER.filter(
    (locale) => !REQUIRED_LOCALES.has(locale) && gaps.some((gap) => gap.locales.includes(locale)),
  );
  return { id, type: translated.type, preview: preparePreview(translated.type, doc.preview ?? {}), required, optional };
};
