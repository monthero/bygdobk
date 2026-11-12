import { Trans } from '@lingui/react/macro';
import { Container, Text, Title } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { BRAND } from './labels';

import classes from './SessionTop.module.css';

type Props = { title: string; progress: ReactNode; format: string; playerCount: number; actions?: ReactNode };

export const SessionTop: FC<Props> = ({ title, progress, format, playerCount, actions }) => (
  <div className={classes.top}>
    <Container className={classes.inner}>
      <div className={classes.heading}>
        <Title order={1} className={classes.title} lineClamp={1}>
          {title || BRAND}
        </Title>
        <Text size="sm" c="dimmed" className={classes.meta}>
          <span className={classes.progress}>{progress}</span>
          <span aria-hidden> · </span>
          {format}
          <span aria-hidden> · </span>
          <Trans>{playerCount} players</Trans>
        </Text>
      </div>
      {actions && <div className={classes.actions}>{actions}</div>}
    </Container>
  </div>
);
