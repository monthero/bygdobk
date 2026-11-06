import { i18n, type Messages } from '@lingui/core';
import dayjs from 'dayjs';

import { contentQuery } from '~/cms/content';
import { queryClient } from '~/cms/queryClient';

import { intlLocale, isAdminPath, LOCALE_META, type Locale } from './locales';

const DAYJS_LOCALES: Record<Exclude<Locale, 'en'>, () => Promise<unknown>> = {
  nb: () => import('dayjs/locale/nb'),
  sv: () => import('dayjs/locale/sv'),
  da: () => import('dayjs/locale/da'),
  fi: () => import('dayjs/locale/fi'),
  is: () => import('dayjs/locale/is'),
  zh: () => import('dayjs/locale/zh-cn'),
};

const applyDayjs = async (locale: Locale) => {
  if (locale !== 'en') await DAYJS_LOCALES[locale]();
  dayjs.locale(LOCALE_META[locale].dayjs);
};

const loadCatalog = async (locale: Locale): Promise<Messages> => (await import(`../locales/${locale}.po`)).messages;

export const activateLocale = async (locale: Locale) => {
  const content = isAdminPath(window.location.pathname) ? undefined : queryClient.prefetchQuery(contentQuery(locale));
  const [messages] = await Promise.all([loadCatalog(locale), applyDayjs(locale), content]);
  i18n.loadAndActivate({ locale, locales: intlLocale(locale), messages });
  document.documentElement.lang = LOCALE_META[locale].lang;
};
