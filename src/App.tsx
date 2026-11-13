import { useLingui } from '@lingui/react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { queryClient } from './cms/queryClient';
import { useResolvedColorScheme } from './hooks/useResolvedColorScheme';
import { useThemeColorMeta } from './hooks/useThemeColorMeta';
import { router } from './router';
import { useSettings } from './stores/settings';
import { buildTheme, cssVariablesResolver } from './theme';

export const App: FC = () => {
  useLingui();
  const palette = useSettings((s) => s.palette);
  const shape = useSettings((s) => s.shape);
  const density = useSettings((s) => s.density);
  const width = useSettings((s) => s.width);
  const font = useSettings((s) => s.font);
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
