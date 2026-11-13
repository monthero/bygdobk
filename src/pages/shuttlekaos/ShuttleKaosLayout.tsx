import { Outlet } from '@tanstack/react-router';
import type { CSSProperties, FC } from 'react';

import shuttleMark from '~/assets/icons/shuttle.svg?url';
import shuttlesCourtWide from '~/assets/photos/shuttles-court-wide.webp?responsive';
import shuttlesCourt from '~/assets/photos/shuttles-court.webp?responsive';

import classes from './ShuttleKaosLayout.module.css';

const MARK_STYLE = { '--sk-shuttle-mask': `url("${shuttleMark}")` } as CSSProperties;

export const ShuttleKaosLayout: FC = () => (
  <>
    <div className={classes.backdrop} aria-hidden>
      <picture>
        <source
          media="(min-aspect-ratio: 1/1)"
          srcSet={shuttlesCourtWide.srcset ?? shuttlesCourtWide.src}
          sizes="100vw"
        />
        <img
          src={shuttlesCourt.src}
          srcSet={shuttlesCourt.srcset}
          sizes="100vw"
          alt=""
          className={classes.image}
          loading="eager"
          decoding="async"
        />
      </picture>
    </div>
    <div className={classes.kaos} style={MARK_STYLE} data-fill>
      <Outlet />
    </div>
  </>
);
