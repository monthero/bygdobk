import { useMediaQuery } from '@mantine/hooks';

import { NavLayout, useSettings } from '~/stores/settings';

const DESKTOP_QUERY = '(min-width: 62em)';

export const useStandaloneNav = () => {
  const side = useSettings((s) => s.navLayout === NavLayout.enum.side);
  const desktop = useMediaQuery(DESKTOP_QUERY);
  return side && desktop;
};
