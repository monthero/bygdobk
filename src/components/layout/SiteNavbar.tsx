import { Trans, useLingui } from '@lingui/react/macro';
import { AppShell, Button, Group, NavLink, Stack } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import { AccountButton } from '~/components/auth';
import { ClubLogo, UserPlus } from '~/components/ui';

import { ExperimentalMark } from './ExperimentalMark';
import { LanguageSwitch } from './LanguageSwitch';
import { NAV } from './nav';
import { ThemeSwitch } from './ThemeSwitch';

import classes from './SiteNavbar.module.css';

const ACTIVE_PROPS = { 'data-active': true };

export const SiteNavbar = memo<{ standalone: boolean }>(({ standalone }) => {
  const { i18n, t } = useLingui();

  return (
    <>
      {standalone && (
        <AppShell.Section className={classes.brand}>
          <Link to="/" aria-label={t`Bygdø Badmintonklubb, front page`} className={classes.brandLink}>
            <ClubLogo height={112} className={classes.logo} />
          </Link>
        </AppShell.Section>
      )}
      <AppShell.Section grow>
        <Stack gap={2}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={
                <>
                  {i18n._(item.label)}
                  {item.experimental && <ExperimentalMark />}
                </>
              }
              leftSection={<item.Icon />}
              activeProps={ACTIVE_PROPS}
              variant="light"
            />
          ))}
          <Button component={Link} to="/medlemskap/bli-medlem" mt="md" leftSection={<UserPlus />}>
            <Trans>Join the club</Trans>
          </Button>
        </Stack>
      </AppShell.Section>
      {standalone ? (
        <AppShell.Section className={classes.actions}>
          <Group gap="xs">
            <LanguageSwitch position="right-end" />
            <ThemeSwitch position="right-end" />
            <AccountButton position="right-end" />
          </Group>
        </AppShell.Section>
      ) : null}
    </>
  );
});
