import { Trans } from '@lingui/react/macro';
import { Container, Text, Title } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import type { SessionLocation } from '~/shuttlekaos/model';

import { BRAND } from './labels';
import { LocationLink } from './LocationPicker';

import classes from './SessionTop.module.css';

type Props = {
  title: string;
  progress: ReactNode;
  duration?: string;
  format: string;
  playerCount: number;
  actions?: ReactNode;
  compact?: boolean;
  location?: SessionLocation | null;
  below?: ReactNode;
};

export const SessionTop: FC<Props> = ({
  title,
  progress,
  duration,
  format,
  playerCount,
  actions,
  compact,
  location,
  below,
}) => (
  <div className={classes.top} data-compact={compact || undefined}>
    <Container className={classes.inner}>
      <div className={classes.heading}>
        <Title order={1} className={classes.title} lineClamp={1}>
          {title || BRAND}
        </Title>
        <Text size="sm" c="dimmed" className={classes.meta}>
          <span className={classes.progress}>{progress}</span>
          {duration && (
            <>
              <span aria-hidden className={classes.dot}>
                ·
              </span>
              <span className={classes.progress}>{duration}</span>
            </>
          )}
          <span aria-hidden className={classes.dot}>
            ·
          </span>
          {format}
          <span aria-hidden className={classes.dot}>
            ·
          </span>
          <Trans>{playerCount} players</Trans>
        </Text>
        {location && (
          <Text size="sm" className={classes.where}>
            <LocationLink location={location} />
          </Text>
        )}
      </div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </Container>
    {below && <Container className={classes.below}>{below}</Container>}
  </div>
);
