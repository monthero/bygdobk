import { i18n } from '@lingui/core';

import { useLocaleStore } from '~/stores/locale';

import { activateLocale } from './activate';
import { DEFAULT_LOCALE, localeInPath, stripLocale, withLocale, type Locale } from './locales';

let urlLocale: Locale = DEFAULT_LOCALE;

export const localeRewrite = {
  input: ({ url }: { url: URL }) => {
    urlLocale = localeInPath(url.pathname) ?? DEFAULT_LOCALE;
    if (urlLocale !== i18n.locale) {
      useLocaleStore.getState().choose(urlLocale);
      void activateLocale(urlLocale);
    }
    url.pathname = stripLocale(url.pathname);
    return url;
  },
  output: ({ url }: { url: URL }) => {
    url.pathname = withLocale(url.pathname, urlLocale);
    return url;
  },
};

export const HASH_ROUTING = !import.meta.env.DEV;

const split = (raw: string) => {
  const cut = raw.search(/[?#]/);
  return cut === -1 ? { pathname: raw, rest: '' } : { pathname: raw.slice(0, cut), rest: raw.slice(cut) };
};

export const readLocation = () =>
  HASH_ROUTING
    ? split(window.location.hash.slice(1) || '/')
    : { pathname: window.location.pathname, rest: window.location.search + window.location.hash };

export const replaceLocation = (path: string) => {
  if (HASH_ROUTING) {
    window.location.replace(`#${path}`);
    return;
  }
  window.history.replaceState(window.history.state, '', path);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
};
