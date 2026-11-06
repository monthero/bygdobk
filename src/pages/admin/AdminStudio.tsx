import type { FC } from 'react';
import { Studio, type StudioThemeColorSchemeKey } from 'sanity';

import { STUDIO_CONFIG } from '~/cms/studio.config';
import { savePreferences } from '~/components/auth/preferences';
import { useResolvedColorScheme } from '~/hooks/useResolvedColorScheme';
import { ColorScheme, useSettings } from '~/stores/settings';

import classes from './AdminStudio.module.css';

const toSiteScheme = (scheme: StudioThemeColorSchemeKey): ColorScheme =>
  scheme === 'system' ? ColorScheme.enum.auto : scheme;

const changeScheme = (scheme: StudioThemeColorSchemeKey) => {
  const colorScheme = toSiteScheme(scheme);
  if (colorScheme === useSettings.getState().colorScheme) return;
  useSettings.getState().set({ colorScheme });
  void savePreferences({ colorScheme });
};

export const AdminStudio: FC = () => {
  const scheme = useResolvedColorScheme();
  return (
    <div className={classes.studio}>
      <Studio config={STUDIO_CONFIG} scheme={scheme} onSchemeChange={changeScheme} />
    </div>
  );
};
