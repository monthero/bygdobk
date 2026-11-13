import { Container } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import { AccountButton } from '~/components/auth';
import { LanguageSwitch } from '~/components/layout/LanguageSwitch';
import { ThemeSwitch } from '~/components/layout/ThemeSwitch';
import { Shuttle } from '~/components/ui';

import { Wordmark } from './BrandHeader';

import classes from './AppHeader.module.css';

export const AppHeader = memo(() => (
  <Container className={classes.inner}>
    <Link to="/shuttlekaos" className={classes.home}>
      <span className={classes.mark} aria-hidden>
        <Shuttle />
      </span>
      <span className={classes.name}>
        <Wordmark />
      </span>
    </Link>
    <div className={classes.actions}>
      <LanguageSwitch />
      <ThemeSwitch />
      <AccountButton />
    </div>
  </Container>
));
