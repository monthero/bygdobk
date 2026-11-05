export const LOCALES = ['en', 'nb', 'sv', 'fi', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

export const SOURCE_LOCALE: Locale = 'en';
export const DEFAULT_LOCALE: Locale = 'nb';

export const LOCALE_META: Record<Locale, { name: string; lang: string; intl: string; dayjs: string; order: number }> = {
  nb: { name: 'Norsk (bokmål)', lang: 'nb', intl: 'nb-NO', dayjs: 'nb', order: 0 },
  en: { name: 'English', lang: 'en', intl: 'en-GB', dayjs: 'en', order: 1 },
  sv: { name: 'Svenska', lang: 'sv', intl: 'sv-SE', dayjs: 'sv', order: 2 },
  fi: { name: 'Suomi', lang: 'fi', intl: 'fi-FI', dayjs: 'fi', order: 3 },
  zh: { name: '简体中文', lang: 'zh-Hans', intl: 'zh-CN', dayjs: 'zh-cn', order: 4 },
};

export const LOCALES_BY_ORDER = LOCALES.toSorted((a, b) => LOCALE_META[a].order - LOCALE_META[b].order);

export const isLocale = (value: unknown): value is Locale => (LOCALES as readonly unknown[]).includes(value);

export const intlLocale = (locale: Locale) => `${LOCALE_META[locale].intl}-u-ca-gregory`;

const prefixOf = (pathname: string) => {
  const segment = pathname.split('/')[1];
  return isLocale(segment) && segment !== DEFAULT_LOCALE ? segment : null;
};

export const localeInPath = (pathname: string): Locale | null => prefixOf(pathname);

export const stripLocale = (pathname: string) => {
  const locale = prefixOf(pathname);
  return locale ? pathname.slice(locale.length + 1) || '/' : pathname;
};

export const withLocale = (pathname: string, locale: Locale) => {
  const bare = stripLocale(pathname);
  if (locale === DEFAULT_LOCALE) return bare;
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
};
