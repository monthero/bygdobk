import { convertCssVariables, defaultCssVariablesResolver, useMantineTheme } from '@mantine/core';
import { memo, useMemo } from 'react';

import { cssVariablesResolver } from '~/theme';

export const DarkScopeStyles = memo(() => {
  const theme = useMantineTheme();
  const css = useMemo(() => {
    const dark = { ...defaultCssVariablesResolver(theme).dark, ...cssVariablesResolver(theme).dark };
    return convertCssVariables({ variables: {}, light: {}, dark }, '[data-bk-dark]');
  }, [theme]);
  return <style>{css}</style>;
});
