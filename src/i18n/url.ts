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

export const readLocation = () => ({
  pathname: window.location.pathname,
  rest: window.location.search + window.location.hash,
});

export const replaceLocation = (path: string) => {
  window.history.replaceState(window.history.state, '', path);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
};
