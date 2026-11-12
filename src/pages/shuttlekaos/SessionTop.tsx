import { Container, Text, Title } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import type { SessionLocation } from '~/shuttlekaos/model';

import { BRAND } from './labels';
import { LocationLink } from './LocationPicker';

import classes from './SessionTop.module.css';

type Props = {
  title: string;
  progress: ReactNode;
  started?: string;
  details?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  location?: SessionLocation | null;
  below?: ReactNode;
};

export const SessionTop: FC<Props> = ({ title, progress, started, details, actions, compact, location, below }) => (
  <div className={classes.top} data-compact={compact || undefined}>
    <Container className={classes.inner}>
      <Title order={1} className={classes.title} lineClamp={1}>
        {title || BRAND}
      </Title>
      <Text size="sm" c="dimmed" className={classes.meta}>
        <span className={classes.progress}>{progress}</span>
        {started && (
          <>
            <span aria-hidden className={classes.dot}>
              ·
            </span>
            <span className={classes.part}>{started}</span>
          </>
        )}
        {location && (
          <>
            <span aria-hidden className={classes.dot}>
              ·
            </span>
            <LocationLink location={location} />
          </>
        )}
      </Text>
      {details && <div className={classes.details}>{details}</div>}
      {actions && <div className={classes.actions}>{actions}</div>}
    </Container>
    {below && <Container className={classes.below}>{below}</Container>}
  </div>
);
