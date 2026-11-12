import { Outlet } from '@tanstack/react-router';
import type { FC } from 'react';

import shuttlesCourtWide from '~/assets/photos/shuttles-court-wide.webp';
import shuttlesCourt from '~/assets/photos/shuttles-court.webp';

import classes from './ShuttleKaosLayout.module.css';

export const ShuttleKaosLayout: FC = () => (
  <>
    <div className={classes.backdrop} aria-hidden>
      <picture>
        <source media="(min-aspect-ratio: 1/1)" srcSet={shuttlesCourtWide} />
        <img src={shuttlesCourt} alt="" className={classes.image} loading="eager" decoding="async" />
      </picture>
    </div>
    <div className={classes.kaos} data-fill>
      <Outlet />
    </div>
  </>
);
