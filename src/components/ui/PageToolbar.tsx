import { Container } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import classes from './PageToolbar.module.css';

export const PageToolbar: FC<{ children: ReactNode }> = ({ children }) => (
  <div className={classes.toolbar} data-bk="toolbar">
    <Container>
      <div className={classes.inner}>{children}</div>
    </Container>
  </div>
);
