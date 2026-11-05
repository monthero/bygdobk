import { Container } from '@mantine/core';
import type { FC } from 'react';

import classes from './CourtDivider.module.css';

export const CourtDivider: FC = () => (
  <div className={classes.divider} aria-hidden>
    <Container h="100%">
      <span className={classes.tick} />
    </Container>
  </div>
);
