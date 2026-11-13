import { Trans } from '@lingui/react/macro';
import { Paper, Text } from '@mantine/core';
import type { FC } from 'react';

import { Shuttle } from '~/components/ui';

import classes from './QuietCourt.module.css';

export const QuietCourt: FC<{ compact?: boolean }> = ({ compact }) => (
  <Paper withBorder radius="lg" className={classes.empty} data-compact={compact || undefined}>
    <div className={classes.court} aria-hidden>
      <svg viewBox="-2 -2 138 65" className={classes.lines}>
        <rect x="0" y="0" width="134" height="61" rx="1" />
        <path d="M0 4.6H134M0 56.4H134M7.6 0V61M126.4 0V61M47.2 0V61M86.8 0V61M0 30.5H47.2M86.8 30.5H134" />
        <path d="M67 -2V63" className={classes.net} />
      </svg>
      <span className={classes.shuttle}>
        <Shuttle />
      </span>
    </div>
    <div className={classes.text}>
      <Text fw={800} className={classes.title}>
        <Trans comment="Empty state when no public sessions are open">Quiet on court.</Trans>
      </Text>
      <Text size="sm" c="dimmed" className={classes.lede}>
        <Trans>Public sessions show up here the moment someone opens one.</Trans>
      </Text>
    </div>
  </Paper>
);
