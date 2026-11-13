import { useEffect } from 'react';

import type { Palette } from '~/stores/settings';
import { bodyColor } from '~/theme';

const META = 'meta[name="theme-color"]';

export const useThemeColorMeta = (palette: Palette, scheme: 'light' | 'dark') => {
  useEffect(() => {
    const color = bodyColor(palette, scheme);
    for (const meta of document.querySelectorAll<HTMLMetaElement>(META)) meta.content = color;
  }, [palette, scheme]);
};
