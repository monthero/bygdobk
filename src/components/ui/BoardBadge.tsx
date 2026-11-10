import { Trans } from '@lingui/react/macro';
import { Badge } from '@mantine/core';
import type { FC } from 'react';

import classes from './BoardBadge.module.css';

export const BoardBadge: FC = () => (
  <Badge component="span" size="xs" variant="light" className={classes.badge}>
    <Trans comment="Badge: this person is on the club board">Board</Trans>
  </Badge>
);
