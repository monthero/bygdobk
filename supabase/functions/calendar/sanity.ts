import { z } from 'zod';

import { CONTENT_FALLBACK, type Locale } from '../../../src/i18n/locales.ts';

const SANITY_QUERY_URL = 'https://psw4r05b.apicdn.sanity.io/v2026-11-01/data/query/production';

export const localized = (field: string) => {
  const own = [`${field}[$lang]`, `${field}[$fallback]`].map((value) => `select(${value} != "" => ${value})`);
  return `coalesce(${own.join(', ')}, ${field}.nb)`;
};

export const opt = <T extends z.ZodType>(schema: T) => schema.nullish().transform((v) => v ?? undefined);

export const Time = z.string().regex(/^\d{2}:\d{2}$/);

export const Venue = z.object({ name: z.string().min(1), address: opt(z.string()) });
export type Venue = z.infer<typeof Venue>;

export const parseList = <T extends z.ZodType>(name: string, item: T, raw: readonly unknown[]) =>
  raw.flatMap((entry): z.output<T>[] => {
    const parsed = item.safeParse(entry);
    if (parsed.success) return [parsed.data];
    console.warn(`Skipped an invalid ${name}`, z.prettifyError(parsed.error));
    return [];
  });

export const sanityQuery = async (query: string, lang: Locale, params: Record<string, string> = {}) => {
  const url = new URL(SANITY_QUERY_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('$lang', JSON.stringify(lang));
  url.searchParams.set('$fallback', JSON.stringify(CONTENT_FALLBACK[lang]));
  for (const [key, value] of Object.entries(params)) url.searchParams.set(`$${key}`, JSON.stringify(value));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity responded ${res.status}: ${await res.text()}`);
  return z.object({ result: z.unknown() }).parse(await res.json()).result;
};
