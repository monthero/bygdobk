import { Trans, useLingui } from '@lingui/react/macro';
import { Burger, Button, Container, VisuallyHidden } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import { AccountButton } from '~/components/auth';
import { ClubLogo } from '~/components/ui';
import { CLUB } from '~/data/club';

import { LanguageSwitch } from './LanguageSwitch';
import { NAV } from './nav';
import { ThemeSwitch } from './ThemeSwitch';

import classes from './SiteHeader.module.css';

type Props = { menuOpened: boolean; onToggleMenu: () => void; showLinks: boolean };

export const SiteHeader = memo<Props>(({ menuOpened, onToggleMenu, showLinks }) => {
  const { i18n, t } = useLingui();

  return (
    <Container className={classes.inner}>
      <Link to="/" className={classes.brand}>
        <ClubLogo mark height={42} className={classes.logo} />
        <span className={classes.brandText}>
          <span className={classes.brandEst} aria-hidden>
            <Trans comment="Short for established, as on the club logo. Norwegian: Etabl.">Est. {CLUB.founded}</Trans>
          </span>
          <span className={classes.brandName}>Bygdø</span>
          <span className={classes.brandEst}>Badmintonklubb</span>
        </span>
        <VisuallyHidden>
          <Trans comment="Read after the club name in the logo link, for screen readers">front page</Trans>
        </VisuallyHidden>
      </Link>

      {showLinks && (
        <nav className={classes.nav} aria-label={t`Main menu`}>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={classes.link}>
              {i18n._(item.label)}
            </Link>
          ))}
        </nav>
      )}

      <div className={classes.actions}>
        {showLinks && (
          <Button component={Link} to="/medlemskap/bli-medlem" visibleFrom="md" radius="md" className={classes.join}>
            <Trans>Join</Trans>
          </Button>
        )}
        <LanguageSwitch />
        <ThemeSwitch />
        <AccountButton />
        <Burger
          opened={menuOpened}
          onClick={onToggleMenu}
          hiddenFrom="md"
          size="sm"
          className={classes.burger}
          aria-label={menuOpened ? t`Close menu` : t`Open menu`}
        />
      </div>
    </Container>
  );
});
