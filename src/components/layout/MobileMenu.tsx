import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, Drawer, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type CSSProperties } from 'react';

import { AddressLink, ClubLogo, Shuttle, SocialLinks, UserPlus } from '~/components/ui';
import { CLUB } from '~/data/club';
import { TRY_SEARCH } from '~/pages/join/offers';

import { NAV } from './nav';

import classes from './MobileMenu.module.css';

const ACTIVE_PROPS = { 'data-active': true };
const CLASS_NAMES = { inner: classes.inner, content: classes.panel, body: classes.body, overlay: classes.overlay };
const TRANSITION = {
  transition: 'slide-left',
  duration: 260,
  timingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const;

type Props = { opened: boolean; onClose: () => void };

export const MobileMenu = memo<Props>(({ opened, onClose }) => {
  const { i18n, t } = useLingui();

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="100%"
      withCloseButton={false}
      padding={0}
      classNames={CLASS_NAMES}
      transitionProps={TRANSITION}
      hiddenFrom="md"
    >
      <nav aria-label={t`Main menu`} className={classes.grid}>
        {NAV.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={ACTIVE_PROPS}
            className={classes.tile}
            style={{ '--i': index } as CSSProperties}
            onClick={onClose}
          >
            <span className={classes.icon}>
              <item.Icon />
            </span>
            <span className={classes.label}>{i18n._(item.label)}</span>
          </Link>
        ))}
      </nav>

      <div className={classes.actions}>
        <Button component={Link} to="/medlemskap/bli-medlem" size="md" leftSection={<UserPlus />} onClick={onClose}>
          <Trans>Join the club</Trans>
        </Button>
        <Button
          size="md"
          variant="default"
          leftSection={<Shuttle />}
          renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" search={TRY_SEARCH} onClick={onClose} />}
        >
          <Trans>Try a session</Trans>
        </Button>
      </div>

      <section className={classes.findUs} aria-labelledby="menu-find-us">
        <div className={classes.findHead}>
          <ClubLogo mark height={44} className={classes.mark} />
          <div className={classes.findText}>
            <Text size="sm" fw={700} id="menu-find-us">
              <Trans>Find us</Trans>
            </Text>
            <Text size="sm">
              <AddressLink />
            </Text>
            <Anchor href={`mailto:${CLUB.email}`} size="sm">
              {CLUB.email}
            </Anchor>
          </div>
        </div>
        <SocialLinks label={false} className={classes.social} />
      </section>
    </Drawer>
  );
});
