import { z } from 'zod';

import { LOCALES, type Locale } from '../../i18n/locales.ts';

export const TEXT_MAX = 8000;
export const ITEMS_MAX = 1000;
export const REQUEST_CHARS_MAX = 100_000;

export const AZURE_LIMITS = { elements: 1000, chars: 50_000 } as const;

const AZURE_LANGUAGE: Record<Locale, string> = {
  nb: 'nb',
  en: 'en',
  sv: 'sv',
  da: 'da',
  fi: 'fi',
  is: 'is',
  zh: 'zh-Hans',
};

const LOCALE_BY_AZURE = new Map(LOCALES.map((locale) => [AZURE_LANGUAGE[locale], locale]));

export const azureLanguage = (locale: Locale) => AZURE_LANGUAGE[locale];

export const localeOfAzure = (code: string) => LOCALE_BY_AZURE.get(code);

const LocaleCode = z.enum(LOCALES);

export const TranslateItem = z.object({ text: z.string().min(1).max(TEXT_MAX), html: z.boolean() });
export type TranslateItem = z.infer<typeof TranslateItem>;

export const billedChars = (items: readonly { text: string }[], targets: number) =>
  items.reduce((sum, item) => sum + item.text.length, 0) * targets;

export const TranslateRequest = z
  .object({
    from: LocaleCode,
    to: z
      .array(LocaleCode)
      .min(1)
      .max(LOCALES.length - 1),
    items: z.array(TranslateItem).min(1).max(ITEMS_MAX),
  })
  .refine(({ from, to }) => !to.includes(from) && new Set(to).size === to.length, 'Pick distinct target languages')
  .refine(({ to, items }) => billedChars(items, to.length) <= REQUEST_CHARS_MAX, 'Too much text in one request');
export type TranslateRequest = z.infer<typeof TranslateRequest>;

export const TranslateResponse = z.object({ translations: z.partialRecord(LocaleCode, z.array(z.string())) });
export type TranslateResponse = z.infer<typeof TranslateResponse>;

export const batchItems = <T extends { text: string }>(
  items: readonly T[],
  targets: number,
  limits: { elements: number; chars: number },
): T[][] => {
  const batches: T[][] = [];
  let current: T[] = [];
  let chars = 0;
  for (const item of items) {
    const size = item.text.length * targets;
    if (current.length > 0 && (current.length >= limits.elements || chars + size > limits.chars)) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(item);
    chars += size;
  }
  if (current.length > 0) batches.push(current);
  return batches;
};

export type TranslateBatch = (
  texts: string[],
  html: boolean,
) => Promise<{ translations: { text: string; to: string }[] }[]>;

export const translateItems = async (
  { to, items }: TranslateRequest,
  translateBatch: TranslateBatch,
): Promise<TranslateResponse> => {
  const found = new Map(to.map((locale) => [locale, new Map<number, string>()]));
  const indexed = items.map((item, index) => ({ ...item, index }));
  for (const [html, group] of Map.groupBy(indexed, (item) => item.html)) {
    for (const batch of batchItems(group, to.length, AZURE_LIMITS)) {
      const results = await translateBatch(
        batch.map(({ text }) => text),
        html,
      );
      for (const [i, { translations }] of results.entries()) {
        const index = batch[i]?.index;
        for (const { text, to: code } of translations) {
          const locale = localeOfAzure(code);
          if (index !== undefined && locale) found.get(locale)?.set(index, text);
        }
      }
    }
  }
  const translations: TranslateResponse['translations'] = {};
  for (const [locale, texts] of found) {
    if (texts.size !== items.length) throw new Error(`Azure Translator skipped ${locale} texts`);
    translations[locale] = Array.from(items, (_, index) => texts.get(index) ?? '');
  }
  return { translations };
};
