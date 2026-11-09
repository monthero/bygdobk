import { Container } from '@mantine/core';
import type { FC } from 'react';

import { IntroText, type PageIntroProps } from '~/components/ui';

import { ShuttleIcon } from './Shuttle';

import classes from './FlightPageIntro.module.css';

const WIDE_TRAIL = 'M101 1 C 42 1, 1 50, 1 104';
const NARROW_TRAIL = 'M104 72 C 70 -22, 30 -22, -4 72';
const PHOTO_SIZES = '(min-width: 62em) 42vw, 100vw';

export const FlightPageIntro: FC<PageIntroProps> = ({ eyebrow, title, lede, photo, children }) => (
  <header className={classes.intro}>
    <div className={classes.sky}>
      <div className={classes.photo} data-photo={photo ? true : undefined}>
        {photo && (
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes={PHOTO_SIZES}
            alt={photo.alt}
            className={classes.image}
            style={{ objectPosition: photo.position }}
            fetchPriority="high"
          />
        )}
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={classes.art} aria-hidden="true">
        <path d={WIDE_TRAIL} data-fit="wide" vectorEffect="non-scaling-stroke" className={classes.trail} />
        <path d={NARROW_TRAIL} data-fit="narrow" vectorEffect="non-scaling-stroke" className={classes.trail} />
      </svg>
      <span className={classes.flyer} aria-hidden="true">
        <ShuttleIcon size={34} />
      </span>
    </div>
    <Container className={classes.inner}>
      <div className={classes.copy}>
        <IntroText eyebrow={eyebrow} title={title} lede={lede} classes={classes}>
          {children}
        </IntroText>
      </div>
    </Container>
  </header>
);
