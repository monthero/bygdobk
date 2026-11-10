import { describe, expect, it } from 'vite-plus/test';

import { LOCALES } from '~/i18n/locales';

import {
  AZURE_LIMITS,
  azureLanguage,
  batchItems,
  billedChars,
  localeOfAzure,
  REQUEST_CHARS_MAX,
  TEXT_MAX,
  TranslateRequest,
  translateItems,
  type TranslateBatch,
} from './request';

const items = (...lengths: number[]) => lengths.map((length) => ({ text: 'a'.repeat(length), html: false }));

describe('locale codes', () => {
  it('uses Azure codes and maps them back', () => {
    expect(azureLanguage('zh')).toBe('zh-Hans');
    expect(azureLanguage('nb')).toBe('nb');
    for (const locale of LOCALES) expect(localeOfAzure(azureLanguage(locale))).toBe(locale);
    expect(localeOfAzure('de')).toBeUndefined();
  });
});

describe('batchItems', () => {
  it('counts characters once per target language', () => {
    const batches = batchItems(items(20_000, 5_000, 1), 2, AZURE_LIMITS);
    expect(batches.map((batch) => batch.map(({ text }) => text.length))).toEqual([[20_000, 5_000], [1]]);
  });

  it('splits at the element limit', () => {
    const batches = batchItems(items(...Array.from({ length: 2500 }, () => 1)), 1, AZURE_LIMITS);
    expect(batches.map((batch) => batch.length)).toEqual([1000, 1000, 500]);
  });

  it('keeps the longest allowed text for six languages in one request', () => {
    expect(batchItems(items(TEXT_MAX, TEXT_MAX), LOCALES.length - 1, AZURE_LIMITS)).toHaveLength(2);
  });

  it('returns no batches for no items', () => {
    expect(batchItems([], 3, AZURE_LIMITS)).toEqual([]);
  });
});

describe('TranslateRequest', () => {
  it.each([
    ['the source is also a target', { from: 'nb', to: ['nb', 'en'], items: items(5) }],
    ['a target repeats', { from: 'nb', to: ['en', 'en'], items: items(5) }],
    ['a language is unknown', { from: 'nb', to: ['de'], items: items(5) }],
    ['there are no items', { from: 'nb', to: ['en'], items: [] }],
    ['a text is empty', { from: 'nb', to: ['en'], items: items(0) }],
    ['a text is too long', { from: 'nb', to: ['en'], items: items(TEXT_MAX + 1) }],
    [
      'the request is too big',
      { from: 'nb', to: ['en', 'sv'], items: items(...Array.from({ length: 7 }, () => TEXT_MAX)) },
    ],
  ])('rejects a request when %s', (_, body) => {
    expect(TranslateRequest.safeParse(body).success).toBe(false);
  });

  it('accepts a request right at the size limit', () => {
    const body = { from: 'en', to: ['nb', 'zh'], items: items(...Array.from({ length: 10 }, () => 5000)) };
    expect(billedChars(body.items, body.to.length)).toBe(REQUEST_CHARS_MAX);
    expect(TranslateRequest.safeParse(body).success).toBe(true);
  });
});

describe('translateItems', () => {
  const fakeAzure =
    (calls: { texts: string[]; html: boolean }[], codes: string[]): TranslateBatch =>
    async (texts, html) => {
      calls.push({ texts, html });
      return texts.map((text) => ({ translations: codes.map((to) => ({ to, text: `${to}:${text}` })) }));
    };

  it('sends plain and html texts apart and returns them in the original order', async () => {
    const calls: { texts: string[]; html: boolean }[] = [];
    const request = {
      from: 'nb' as const,
      to: ['en' as const, 'zh' as const],
      items: [
        { text: 'a', html: false },
        { text: '<div>b</div>', html: true },
        { text: 'c', html: false },
      ],
    };
    const result = await translateItems(request, fakeAzure(calls, ['en', 'zh-Hans']));
    expect(calls).toEqual([
      { texts: ['a', 'c'], html: false },
      { texts: ['<div>b</div>'], html: true },
    ]);
    expect(result.translations).toEqual({
      en: ['en:a', 'en:<div>b</div>', 'en:c'],
      zh: ['zh-Hans:a', 'zh-Hans:<div>b</div>', 'zh-Hans:c'],
    });
  });

  it('splits large requests into several Azure calls', async () => {
    const calls: { texts: string[]; html: boolean }[] = [];
    const request = { from: 'en' as const, to: ['nb' as const, 'sv' as const], items: items(8000, 8000, 8000, 8000) };
    const result = await translateItems(request, fakeAzure(calls, ['nb', 'sv']));
    expect(calls.map(({ texts }) => texts.length)).toEqual([3, 1]);
    expect(result.translations.nb).toHaveLength(4);
  });

  it('fails when Azure leaves out a language', async () => {
    const request = { from: 'nb' as const, to: ['en' as const, 'sv' as const], items: items(3) };
    await expect(translateItems(request, fakeAzure([], ['en']))).rejects.toThrow();
  });
});
