import { createImageUrlBuilder } from '@sanity/image-url';
import { z } from 'zod';

import { sanityQueryUrl } from '../src/cms/queryUrl.js';
import { CONTENT_FALLBACK, DEFAULT_LOCALE, type Locale } from '../src/i18n/locales.js';

const SANITY = { projectId: process.env.VITE_SANITY_PROJECT_ID ?? '', dataset: process.env.VITE_SANITY_DATASET ?? '' };

export const VISITOR_KINDS = ['tournament', 'social', 'meeting', 'trip'];

const QueryResponse = z.object({ result: z.unknown() });

export const sanityQuery = async <T extends z.ZodType>(schema: T, query: string, params?: Record<string, unknown>) => {
  const response = await fetch(sanityQueryUrl(SANITY, query, params));
  if (!response.ok) throw new Error(`Sanity query failed with ${response.status}`);
  return schema.parse(QueryResponse.parse(await response.json()).result);
};

export const imageBuilder = createImageUrlBuilder(SANITY);

export const LocaleText = z.record(z.string(), z.unknown()).nullish();

export const localized = (value: z.output<typeof LocaleText>, locale: Locale) => {
  for (const candidate of [locale, CONTENT_FALLBACK[locale], DEFAULT_LOCALE]) {
    const text = value?.[candidate];
    if (typeof text === 'string' && text.trim()) return text.trim();
  }
  return undefined;
};
