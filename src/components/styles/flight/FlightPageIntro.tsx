import { Container, Text, Title } from '@mantine/core';
import type { CSSProperties, FC } from 'react';

import type { PageIntroProps } from '~/components/ui';

import { ShuttleIcon } from './Shuttle';

import classes from './FlightPageIntro.module.css';

const WIDE_TRAIL = 'M101 1 C 42 1, 1 50, 1 104';
const NARROW_TRAIL = 'M104 72 C 70 -22, 30 -22, -4 72';

export const FlightPageIntro: FC<PageIntroProps> = ({ eyebrow, title, lede, photo, children }) => {
  const style = photo ? ({ '--intro-photo': `url("${photo.src}")` } as CSSProperties) : undefined;
  return (
    <header className={classes.intro} style={style}>
      <div className={classes.sky}>
        <span
          role={photo ? 'img' : undefined}
          aria-label={photo?.alt}
          className={classes.photo}
          style={{ backgroundPosition: photo?.position }}
        />
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
          {eyebrow && <Text className={classes.eyebrow}>{eyebrow}</Text>}
          <Title order={1} className={classes.title}>
            {title}
          </Title>
          {lede && <Text className={classes.lede}>{lede}</Text>}
          {children}
        </div>
      </Container>
    </header>
  );
};
