import { useLingui } from '@lingui/react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider, type DatesProviderSettings } from '@mantine/dates';
import { useColorScheme } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { createBrowserHistory, createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { currentLocale } from './i18n/current';
import { LOCALE_META } from './i18n/locales';
import { HASH_ROUTING, localeRewrite } from './i18n/url';
import { NotFoundPage } from './pages/NotFoundPage';
import { routeTree } from './routeTree.gen';
import { ColorScheme, useSettings } from './stores/settings';
import { buildTheme, cssVariablesResolver } from './theme';

const router = createRouter({
  routeTree,
  history: HASH_ROUTING ? createHashHistory() : createBrowserHistory(),
  rewrite: localeRewrite,
  scrollRestoration: true,
  defaultNotFoundComponent: NotFoundPage,
});

const WEEKEND_DAYS: DatesProviderSettings['weekendDays'] = [0, 6];

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const SYSTEM_SCHEME_OPTIONS = { getInitialValueInEffect: false };

export const App: FC = () => {
  useLingui();
  const palette = useSettings((s) => s.palette);
  const shape = useSettings((s) => s.shape);
  const density = useSettings((s) => s.density);
  const width = useSettings((s) => s.width);
  const font = useSettings((s) => s.font);
  const chosenScheme = useSettings((s) => s.colorScheme);
  const systemScheme = useColorScheme('light', SYSTEM_SCHEME_OPTIONS);
  const colorScheme = chosenScheme === ColorScheme.enum.auto ? systemScheme : chosenScheme;
  const theme = useMemo(
    () => buildTheme({ palette, shape, density, width, font }),
    [palette, shape, density, width, font],
  );
  const dayjsLocale = LOCALE_META[currentLocale()].dayjs;
  const datesSettings = useMemo<DatesProviderSettings>(
    () => ({ locale: dayjsLocale, firstDayOfWeek: 1, weekendDays: WEEKEND_DAYS }),
    [dayjsLocale],
  );

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme} cssVariablesResolver={cssVariablesResolver}>
      <DatesProvider settings={datesSettings}>
        <Notifications position="bottom-center" limit={3} />
        <RouterProvider router={router} />
      </DatesProvider>
    </MantineProvider>
  );
};
