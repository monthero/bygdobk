import { Container, Text, Title, type TitleOrder } from '@mantine/core';
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

type IntroClasses = { eyebrow?: string; title?: string; lede?: string };

export const IntroText: FC<Omit<PageIntroProps, 'photo'> & { classes: IntroClasses; order?: TitleOrder }> = ({
  eyebrow,
  title,
  lede,
  children,
  classes: names,
  order = 1,
}) => (
  <>
    {eyebrow && <Text className={names.eyebrow}>{eyebrow}</Text>}
    <Title order={order} className={names.title}>
      {title}
    </Title>
    {lede && <Text className={names.lede}>{lede}</Text>}
    {children}
  </>
);

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
      <IntroText eyebrow={eyebrow} title={title} lede={lede} classes={classes}>
        {children}
      </IntroText>
    </Container>
  </header>
);
