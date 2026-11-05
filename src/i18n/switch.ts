import { useLocaleStore } from '~/stores/locale';

import { activateLocale } from './activate';
import { withLocale, type Locale } from './locales';
import { readLocation, replaceLocation } from './url';

export const switchLocale = async (locale: Locale) => {
  useLocaleStore.getState().choose(locale);
  await activateLocale(locale);
  const { pathname, rest } = readLocation();
  const next = withLocale(pathname, locale);
  if (next !== pathname) replaceLocation(next + rest);
};
