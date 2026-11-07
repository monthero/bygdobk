import { Container, Text, Title } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import type { SitePhoto } from '~/cms/siteData';

import classes from './PageIntro.module.css';

export type PageIntroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  photo?: SitePhoto;
  children?: ReactNode;
};

export const PageIntroBase: FC<PageIntroProps> = ({ eyebrow, title, lede, photo, children }) => (
  <header className={classes.intro} data-photo={photo ? true : undefined}>
    {photo && (
      <div className={classes.photo}>
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="100vw"
          alt={photo.alt}
          className={classes.image}
          style={{ objectPosition: photo.position }}
          fetchPriority="high"
        />
      </div>
    )}
    <Container className={classes.inner}>
      {eyebrow && <Text className={classes.eyebrow}>{eyebrow}</Text>}
      <Title order={1} className={classes.title}>
        {title}
      </Title>
      {lede && <Text className={classes.lede}>{lede}</Text>}
      {children}
    </Container>
  </header>
);
