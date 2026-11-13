import { useLingui } from '@lingui/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, useRouterState } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { queryClient } from './cms/queryClient';
import { useResolvedColorScheme } from './hooks/useResolvedColorScheme';
import { useThemeColorMeta } from './hooks/useThemeColorMeta';
import { router } from './router';
import { useDesign } from './stores/settings';
import { buildTheme, cssVariablesResolver } from './theme';
import { selectIsShuttleKaos } from './utils/apps';

export const App: FC = () => {
  useLingui();
  const kaos = useRouterState({ router, select: selectIsShuttleKaos });
  const { palette, shape, density, width, font } = useDesign(kaos);
  const colorScheme = useResolvedColorScheme();
  useThemeColorMeta(palette, colorScheme);
  const theme = useMemo(
    () => buildTheme({ palette, shape, density, width, font }),
    [palette, shape, density, width, font],
  );

  return (
    <MantineProvider theme={theme} forceColorScheme={colorScheme} cssVariablesResolver={cssVariablesResolver}>
      <Notifications position="bottom-center" limit={3} />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  );
};
