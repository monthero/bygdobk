import { Container, Text, Title } from '@mantine/core';
import { memo, type FC } from 'react';

import type { PageIntroProps } from '~/components/ui';

import { LENGTH, LINES, lineKey, NET, WIDTH } from './geometry';

import classes from './CourtPageIntro.module.css';

const PHOTO_SIZES = '(min-width: 62em) 44vw, 100vw';

const PanelLines = memo(() => (
  <svg
    viewBox={`0 0 ${LENGTH} ${WIDTH}`}
    preserveAspectRatio="none"
    className={classes.lines}
    aria-hidden
    focusable="false"
  >
    <rect x={0} y={0} width={LENGTH} height={WIDTH} />
    {LINES.map((line) => {
      const [x1, y1, x2, y2] = line;
      return <line key={lineKey(line)} x1={x1} y1={y1} x2={x2} y2={y2} />;
    })}
    <line x1={NET[0]} y1={NET[1]} x2={NET[2]} y2={NET[3]} className={classes.net} />
  </svg>
));

export const CourtPageIntro: FC<PageIntroProps> = ({ eyebrow, title, lede, photo, children }) => (
  <header className={classes.intro} data-photo={photo ? true : undefined}>
    <div className={classes.panel}>
      {photo && (
        <div className={classes.photo}>
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes={PHOTO_SIZES}
            alt={photo.alt}
            className={classes.image}
            style={{ objectPosition: photo.position }}
            fetchPriority="high"
          />
        </div>
      )}
      <div className={classes.court}>
        <PanelLines />
      </div>
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
    <span className={classes.ruler} aria-hidden />
  </header>
);
