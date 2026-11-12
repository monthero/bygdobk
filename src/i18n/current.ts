import { i18n, type MessageDescriptor } from '@lingui/core';

import { intlLocale, isLocale, SOURCE_LOCALE, type Locale } from './locales';

export type Translate = (descriptor: MessageDescriptor) => string;

export const currentLocale = (): Locale => (isLocale(i18n.locale) ? i18n.locale : SOURCE_LOCALE);

const cachedFormat = <O, F>(make: (tag: string, options: O) => F) => {
  const cache = new Map<string, F>();
  return (options: O) => {
    const tag = intlLocale(currentLocale());
    const key = `${tag}|${JSON.stringify(options)}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const format = make(tag, options);
    cache.set(key, format);
    return format;
  };
};

const numberFormats = cachedFormat((tag, options: Intl.NumberFormatOptions) => new Intl.NumberFormat(tag, options));

export const numberFormat = (options: Intl.NumberFormatOptions = {}) => numberFormats(options);

export const dateFormat = cachedFormat(
  (tag, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(tag, { timeZone: 'UTC', ...options }),
);

const listFormats = cachedFormat<null, Intl.ListFormat>((tag) => new Intl.ListFormat(tag, { type: 'conjunction' }));

export const listFormat = () => listFormats(null);

const unitListFormats = cachedFormat<null, Intl.ListFormat>(
  (tag) => new Intl.ListFormat(tag, { type: 'unit', style: 'narrow' }),
);

export const unitListFormat = () => unitListFormats(null);

const orListFormats = cachedFormat<null, Intl.ListFormat>((tag) => new Intl.ListFormat(tag, { type: 'disjunction' }));

export const orListFormat = () => orListFormats(null);
