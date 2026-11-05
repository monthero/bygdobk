import { Container } from '@mantine/core';
import type { FC } from 'react';

import { ShuttleIcon } from './Shuttle';

import classes from './FlightDivider.module.css';

export const FlightDivider: FC = () => (
  <Container className={classes.divider} aria-hidden="true">
    <svg viewBox="0 0 1000 48" preserveAspectRatio="none" className={classes.arc}>
      <path d="M4 44 Q 500 -36 966 40" vectorEffect="non-scaling-stroke" className={classes.trail} />
    </svg>
    <ShuttleIcon size={26} className={classes.shuttle} />
  </Container>
);
