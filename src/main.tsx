import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@fontsource-variable/instrument-sans';
import '@fontsource/chakra-petch/latin-500.css';
import '@fontsource/chakra-petch/latin-600.css';
import '@fontsource/chakra-petch/latin-700.css';
import '@fontsource/chakra-petch/latin-ext-500.css';
import '@fontsource/chakra-petch/latin-ext-600.css';
import '@fontsource/chakra-petch/latin-ext-700.css';
import './styles/global.css';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App, router } from './App';
import { IS_PREVIEW, startPreview } from './cms/preview/mode';
import { activateLocale } from './i18n/activate';
import { DEFAULT_LOCALE, localeInPath, withLocale } from './i18n/locales';
import { readLocation, replaceLocation } from './i18n/url';
import { useLocaleStore } from './stores/locale';

const initialLocale = () => {
  const fromPath = localeInPath(readLocation().pathname);
  if (fromPath) useLocaleStore.getState().choose(fromPath);
  return fromPath ?? useLocaleStore.getState().chosen ?? DEFAULT_LOCALE;
};

const boot = async () => {
  const locale = initialLocale();
  const { pathname, rest } = readLocation();
  const localized = withLocale(pathname, locale);
  if (localized !== pathname) replaceLocation(localized + rest);
  if (IS_PREVIEW) void startPreview(router.history);
  await activateLocale(locale);
  const root = document.getElementById('root');
  if (!root) return;
  createRoot(root).render(
    <StrictMode>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
};

void boot();
