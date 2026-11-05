import { i18n, type Messages } from '@lingui/core';
import dayjs from 'dayjs';

import { intlLocale, LOCALE_META, type Locale } from './locales';

const DAYJS_LOCALES: Record<Exclude<Locale, 'en'>, () => Promise<unknown>> = {
  nb: () => import('dayjs/locale/nb'),
  sv: () => import('dayjs/locale/sv'),
  fi: () => import('dayjs/locale/fi'),
  zh: () => import('dayjs/locale/zh-cn'),
};

const applyDayjs = async (locale: Locale) => {
  if (locale !== 'en') await DAYJS_LOCALES[locale]();
  dayjs.locale(LOCALE_META[locale].dayjs);
};

const loadCatalog = async (locale: Locale): Promise<Messages> => (await import(`../locales/${locale}.po`)).messages;

export const activateLocale = async (locale: Locale) => {
  const [messages] = await Promise.all([loadCatalog(locale), applyDayjs(locale)]);
  i18n.loadAndActivate({ locale, locales: intlLocale(locale), messages });
  document.documentElement.lang = LOCALE_META[locale].lang;
};
