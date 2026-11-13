import { Container, Text, Title } from '@mantine/core';
import { Fragment, type FC, type ReactNode } from 'react';

import type { SessionLocation } from '~/shuttlekaos/model';

import { BackButton } from './BrandHeader';
import { BRAND } from './labels';
import { LocationLink } from './LocationPicker';

import classes from './SessionTop.module.css';

const NO_PARTS: ReactNode[] = [];

type Props = {
  title: string;
  progress: ReactNode;
  parts?: ReactNode[];
  details?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  location?: SessionLocation | null;
  below?: ReactNode;
};

export const SessionTop: FC<Props> = ({
  title,
  progress,
  parts = NO_PARTS,
  details,
  actions,
  compact,
  location,
  below,
}) => (
  <div className={classes.top} data-compact={compact || undefined}>
    <Container className={classes.inner}>
      <div className={classes.heading}>
        <BackButton size={compact ? 34 : 40} />
        <Title order={1} className={classes.title} lineClamp={1}>
          {title || BRAND}
        </Title>
      </div>
      <Text size="sm" c="dimmed" className={classes.meta}>
        <span className={classes.progress}>{progress}</span>
        {parts.filter(Boolean).map((part, index) => (
          <Fragment key={index}>
            <span aria-hidden className={classes.dot}>
              ·
            </span>
            <span className={classes.part}>{part}</span>
          </Fragment>
        ))}
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
