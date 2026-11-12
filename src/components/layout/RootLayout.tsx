import { Trans } from '@lingui/react/macro';
import { AppShell } from '@mantine/core';
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks';
import { Outlet, useRouterState, type RouterState } from '@tanstack/react-router';
import { lazy, Suspense, useEffect, useState, type FC } from 'react';

import { usePreferenceSync } from '~/components/auth/preferences';
import { useStyleKit } from '~/components/styles';
import { useStandaloneNav } from '~/hooks/useStandaloneNav';
import type { FileRoutesById } from '~/routeTree.gen';
import { HeadingFont, NavLayout, Style, useSettings } from '~/stores/settings';
import { useUi } from '~/stores/ui';
import { loadVariantFonts } from '~/utils/variantFonts';

import { MobileMenu } from './MobileMenu';
import { ScrollTitleBar } from './ScrollTitleBar';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { SiteNavbar } from './SiteNavbar';
import { SiteNotice } from './SiteNotice';
import { SponsorStrip } from './SponsorStrip';

import classes from './RootLayout.module.css';

const LoginModal = lazy(() => import('~/components/auth/LoginModal'));

const HEADER_HEIGHT = 64;
const HEADROOM_FIXED_AT = 64;
const SMALL_SCREEN = '(max-width: 48em)';

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
  const standalone = useStandaloneNav();
  usePreferenceSync();
  const style = useSettings((s) => s.style);
  const { PageDecor } = useStyleKit();
  const loginOpened = useUi((s) => s.loginOpened);
  const smallScreen = useMediaQuery(SMALL_SCREEN);
  const autoHide = useUi((s) => s.autoHideHeader) && smallScreen;
  const focus = useUi((s) => s.focusMode);
  const { pinned } = useHeadroom({ fixedAt: HEADROOM_FIXED_AT });
  const headerHidden = focus || (autoHide && !pinned);
  const floating = !standalone && (autoHide || focus);
  const [loginLoaded, setLoginLoaded] = useState(loginOpened);
  if (loginOpened && !loginLoaded) setLoginLoaded(true);

  const font = useSettings((s) => s.font);

  useEffect(() => {
    document.documentElement.dataset.style = style;
  }, [style]);

  useEffect(() => {
    if (style !== Style.enum.classic || font !== HeadingFont.enum.chakra) loadVariantFonts();
  }, [style, font]);

  useEffect(close, [pathname, close]);

  return (
    <>
      <a href="#main" className={classes.skip}>
        <Trans>Skip to content</Trans>
      </a>
      <AppShell
        header={standalone ? undefined : { height: HEADER_HEIGHT, collapsed: headerHidden, offset: !floating }}
        __vars={{ '--bk-header-shown': standalone || headerHidden ? '0px' : `${HEADER_HEIGHT}px` }}
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
        <AppShell.Main id="main" className={classes.main} data-headroom={(floating && !focus) || undefined}>
          {standalone && !focus && <ScrollTitleBar />}
          {!focus && <SiteNotice />}
          <div className={classes.content}>
            <Outlet />
          </div>
          {showStrip && <SponsorStrip />}
          {!focus && <SiteFooter />}
        </AppShell.Main>
      </AppShell>
      <MobileMenu opened={opened} onClose={close} />
      <PageDecor />
      {loginLoaded && (
        <Suspense fallback={null}>
          <LoginModal />
        </Suspense>
      )}
    </>
  );
};
