import type { CSSProperties, FC } from 'react';

import { NavLayout, useSettings, Width } from '~/stores/settings';

import { Shuttle } from './Shuttle';

import classes from './FlightDecor.module.css';

const PATH = 'M64 8 C 4 140, 4 340, 64 472';
const FLYER_STYLE: CSSProperties = { offsetPath: `path('${PATH}')` };

export const FlightDecor: FC = () => {
  const width = useSettings((s) => s.width);
  const navLayout = useSettings((s) => s.navLayout);
  if (width === Width.enum.full) return null;

  return (
    <div className={classes.decor} data-nav={navLayout === NavLayout.enum.side ? 'side' : undefined} aria-hidden="true">
      <svg viewBox="0 0 80 480" width="80" height="480" className={classes.art}>
        <path d={PATH} className={classes.trail} />
        <Shuttle className={classes.flyer} style={FLYER_STYLE} />
      </svg>
    </div>
  );
};
