import { getDraftId, type SanityClient } from 'sanity';
import { z } from 'zod';

import { LOCALES_BY_ORDER, REQUIRED_LOCALES, type Locale } from '~/i18n/locales';
import { getSupabase } from '~/supabase/client';

import { asRecord, NodeKind, type FieldNode } from './missing';
import { planValue, type Plan } from './portableText';
import { batchItems, ITEMS_MAX, TranslateResponse, type TranslateItem, type TranslateRequest } from './request';

const SOURCES = LOCALES_BY_ORDER.filter((locale) => REQUIRED_LOCALES.has(locale));
const CALL_CHARS_MAX = 30_000;
const DOCUMENTS_QUERY = '*[_id in [$id, $draftId]]{ "revision": _rev, "content": @ }';

const RATE_LIMITED = 'Too much at once, try again in a minute.';
const NO_ACCESS = 'Only board members can translate. Log in again and try once more.';
const FAILED = 'Could not translate. Try again later.';
const CHANGED = 'Someone changed this text while it was translating. Try again.';

class RateLimitError extends Error {}

const ErrorBody = z.object({ error: z.string() });

const SanityDocuments = z.array(
  z.object({ revision: z.string(), content: z.looseObject({ _id: z.string(), _type: z.string() }) }),
);

export type FieldJob = { path: string; source: Locale; targets: Locale[]; plan: Plan };

const isFilled = (value: unknown) => (typeof value === 'string' || Array.isArray(value)) && value.length > 0;

const hasText = (value: unknown) => (typeof value === 'string' ? value.trim().length > 0 : isFilled(value));

const itemPath = (parent: string, item: unknown, index: number) => {
  const key = asRecord(item)?._key;
  return typeof key === 'string' ? `${parent}[_key=="${key}"]` : `${parent}[${index}]`;
};

const localizedJob = (path: string, value: unknown): FieldJob | undefined => {
  const record = asRecord(value);
  if (!record) return undefined;
  const source = SOURCES.find((locale) => hasText(record[locale]));
  if (!source) return undefined;
  const targets = LOCALES_BY_ORDER.filter((locale) => locale !== source && !isFilled(record[locale]));
  const plan = planValue(record[source]);
  return targets.length > 0 && plan ? { path, source, targets, plan } : undefined;
};

export const fieldJobs = (nodes: readonly FieldNode[], value: unknown, trail = ''): FieldJob[] => {
  const record = asRecord(value);
  if (!record) return [];
  return nodes.flatMap((node) => {
    const field = record[node.name];
    const path = trail ? `${trail}.${node.name}` : node.name;
    switch (node.kind) {
      case NodeKind.enum.localized:
        return localizedJob(path, field) ?? [];
      case NodeKind.enum.object:
        return fieldJobs(node.children, field, path);
      case NodeKind.enum.array:
        return Array.isArray(field)
          ? field.flatMap((item, index) => fieldJobs(node.children, item, itemPath(path, item, index)))
          : [];
    }
  });
};

const failureOf = async (error: unknown) => {
  const context: unknown = error instanceof Error && 'context' in error ? error.context : undefined;
  if (!(context instanceof Response)) return new Error(FAILED);
  const body = ErrorBody.safeParse(await context.json().catch(() => null)).data;
  if (context.status === 429) return new RateLimitError(body?.error ?? RATE_LIMITED);
  if (context.status === 401 || context.status === 403) return new Error(NO_ACCESS);
  return new Error(FAILED);
};

const requestTranslations = async (body: TranslateRequest) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke('translate', { body });
  if (error) throw await failureOf(error);
  return TranslateResponse.parse(data).translations;
};

const translateTo = async (source: Locale, target: Locale, items: TranslateItem[]) => {
  const out: string[] = [];
  for (const batch of batchItems(items, 1, { elements: ITEMS_MAX, chars: CALL_CHARS_MAX })) {
    const translations = await requestTranslations({ from: source, to: [target], items: batch });
    const texts = translations[target];
    if (texts?.length !== batch.length) throw new Error(FAILED);
    out.push(...texts);
  }
  return out;
};

const fillTarget = async (jobs: readonly FieldJob[], source: Locale, target: Locale, set: Record<string, unknown>) => {
  const out = await translateTo(
    source,
    target,
    jobs.flatMap(({ plan }) => plan.items),
  );
  let offset = 0;
  for (const { path, plan } of jobs) {
    set[`${path}.${target}`] = plan.build(out.slice(offset, offset + plan.items.length));
    offset += plan.items.length;
  }
};

const loadDocument = async (client: SanityClient, id: string) => {
  const draftId = getDraftId(id);
  const docs = SanityDocuments.parse(
    await client.withConfig({ perspective: 'raw' }).fetch(DOCUMENTS_QUERY, { id, draftId }),
  );
  return {
    draftId,
    draft: docs.find(({ content }) => content._id === draftId),
    published: docs.find(({ content }) => content._id === id)?.content,
  };
};

const isConflict = (error: unknown) =>
  typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 409;

const writeDraft = async (client: SanityClient, loaded: Awaited<ReturnType<typeof loadDocument>>, set: object) => {
  const { draftId, draft, published } = loaded;
  const transaction = client.transaction();
  if (draft) {
    transaction.patch(draftId, (patch) => patch.ifRevisionId(draft.revision).set(set));
  } else if (published) {
    transaction.create({ ...published, _id: draftId }).patch(draftId, (patch) => patch.set(set));
  } else {
    throw new Error(FAILED);
  }
  try {
    await transaction.commit({ visibility: 'sync' });
  } catch (error) {
    throw new Error(isConflict(error) ? CHANGED : FAILED, { cause: error });
  }
};

export type TranslateOutcome = { added: number; limit?: string };

export const translateDocument = async (
  client: SanityClient,
  id: string,
  nodes: readonly FieldNode[],
): Promise<TranslateOutcome> => {
  const loaded = await loadDocument(client, id);
  const jobs = fieldJobs(nodes, loaded.draft?.content ?? loaded.published);
  const steps = SOURCES.flatMap((source) =>
    LOCALES_BY_ORDER.flatMap((target) => {
      const needing = jobs.filter((job) => job.source === source && job.targets.includes(target));
      return needing.length > 0 ? [{ source, target, needing }] : [];
    }),
  );
  const set: Record<string, unknown> = {};
  let limit: string | undefined;
  for (const { source, target, needing } of steps) {
    try {
      await fillTarget(needing, source, target, set);
    } catch (error) {
      if (!(error instanceof RateLimitError)) throw error;
      limit = error.message;
      break;
    }
  }
  const added = Object.keys(set).length;
  if (added > 0) await writeDraft(client, loaded, set);
  return { added, limit };
};
