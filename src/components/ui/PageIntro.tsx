import { useLingui } from '@lingui/react/macro';
import { Container, Text, Title } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import type { Photo } from '~/data/photos';

import classes from './PageIntro.module.css';

export type PageIntroProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  photo?: Photo;
  children?: ReactNode;
};

export const PageIntroBase: FC<PageIntroProps> = ({ eyebrow, title, lede, photo, children }) => {
  const { i18n } = useLingui();
  return (
    <header className={classes.intro} data-photo={photo ? true : undefined}>
      {photo && (
        <div className={classes.photo}>
          <img
            src={photo.src}
            alt={i18n._(photo.alt)}
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
};
