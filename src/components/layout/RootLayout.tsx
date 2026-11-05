import { Trans } from '@lingui/react/macro';
import { AppShell } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { Outlet, useRouterState, type RouterState } from '@tanstack/react-router';
import { useEffect, type FC } from 'react';

import { EditModeAffix, LoginModal } from '~/components/auth';
import { useStyleKit } from '~/components/styles';
import type { FileRoutesById } from '~/routeTree.gen';
import { NavLayout, useSettings } from '~/stores/settings';

import { MobileMenu } from './MobileMenu';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { SiteNavbar } from './SiteNavbar';
import { SiteNotice } from './SiteNotice';
import { SponsorStrip } from './SponsorStrip';

import classes from './RootLayout.module.css';

const HEADER = { height: 64 };
const DESKTOP_QUERY = '(min-width: 62em)';

const NO_STRIP_ROUTES = new Set<keyof FileRoutesById>(['/medlemskap/bli-medlem']);

const selectPathname = (s: RouterState) => s.location.pathname;
const selectShowStrip = (s: RouterState) =>
  !s.matches.some(
    ({ _notFound, status, routeId }) => _notFound || status === 'notFound' || NO_STRIP_ROUTES.has(routeId),
  );

export const RootLayout: FC = () => {
  const navLayout = useSettings((s) => s.navLayout);
  const [opened, { toggle, close }] = useDisclosure(false);
  const pathname = useRouterState({ select: selectPathname });
  const showStrip = useRouterState({ select: selectShowStrip });
  const side = navLayout === NavLayout.enum.side;
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const standalone = side && desktop;
  const style = useSettings((s) => s.style);
  const { PageDecor } = useStyleKit();

  useEffect(() => {
    document.documentElement.dataset.style = style;
  }, [style]);

  useEffect(close, [pathname, close]);

  return (
    <>
      <a href="#main" className={classes.skip}>
        <Trans>Skip to content</Trans>
      </a>
      <AppShell
        header={standalone ? undefined : HEADER}
        navbar={{ width: 248, breakpoint: 'md', collapsed: { mobile: true, desktop: !side } }}
        padding={0}
      >
        {!standalone && (
          <AppShell.Header>
            <SiteHeader menuOpened={opened} onToggleMenu={toggle} showLinks={!side} />
          </AppShell.Header>
        )}
        <AppShell.Navbar p="sm">
          <SiteNavbar standalone={standalone} />
        </AppShell.Navbar>
        <AppShell.Main id="main" className={classes.main}>
          <SiteNotice />
          <div className={classes.content}>
            <Outlet />
          </div>
          {showStrip && <SponsorStrip />}
          <SiteFooter />
        </AppShell.Main>
      </AppShell>
      <MobileMenu opened={opened} onClose={close} />
      <PageDecor />
      <LoginModal />
      <EditModeAffix />
    </>
  );
};
