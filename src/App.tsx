import { useLingui } from '@lingui/react';
import { MantineProvider } from '@mantine/core';
import { DatesProvider, type DatesProviderSettings } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { queryClient } from './cms/queryClient';
import { ContentError } from './components/layout';
import { useResolvedColorScheme } from './hooks/useResolvedColorScheme';
import { currentLocale } from './i18n/current';
import { LOCALE_META } from './i18n/locales';
import { localeRewrite } from './i18n/url';
import { NotFoundPage } from './pages/NotFoundPage';
import { routeTree } from './routeTree.gen';
import { useSettings } from './stores/settings';
import { buildTheme, cssVariablesResolver } from './theme';

const router = createRouter({
  routeTree,
  rewrite: localeRewrite,
  scrollRestoration: true,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: ContentError,
});

const WEEKEND_DAYS: DatesProviderSettings['weekendDays'] = [0, 6];

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const App: FC = () => {
  useLingui();
  const palette = useSettings((s) => s.palette);
  const shape = useSettings((s) => s.shape);
  const density = useSettings((s) => s.density);
  const width = useSettings((s) => s.width);
  const font = useSettings((s) => s.font);
  const colorScheme = useResolvedColorScheme();
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
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </DatesProvider>
    </MantineProvider>
  );
};
