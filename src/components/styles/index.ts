import { Style, useSettings } from '~/stores/settings';

import { classicKit } from './classic';
import { courtKit } from './court';
import { flightKit } from './flight';
import type { StyleKit } from './types';

const KITS: Record<Style, StyleKit> = {
  [Style.enum.classic]: classicKit,
  [Style.enum.court]: { ...classicKit, ...courtKit },
  [Style.enum.flight]: { ...classicKit, ...flightKit },
};

export const useStyleKit = () => KITS[useSettings((s) => s.style)];

export type { StyleKit } from './types';
export { PageIntro } from './PageIntro';
