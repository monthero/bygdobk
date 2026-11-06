import { useColorScheme } from '@mantine/hooks';

import { ColorScheme, useSettings } from '~/stores/settings';

const SYSTEM_SCHEME_OPTIONS = { getInitialValueInEffect: false };

export const useResolvedColorScheme = () => {
  const chosen = useSettings((s) => s.colorScheme);
  const system = useColorScheme('light', SYSTEM_SCHEME_OPTIONS);
  return chosen === ColorScheme.enum.auto ? system : chosen;
};
