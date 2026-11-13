import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Container } from '@mantine/core';
import { Link, Outlet } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';
import { z } from 'zod';
import ChartBar from '~icons/ph/chart-bar';
import ChartBarFill from '~icons/ph/chart-bar-fill';
import PlayCircle from '~icons/ph/play-circle';
import PlayCircleFill from '~icons/ph/play-circle-fill';
import UsersThree from '~icons/ph/users-three';
import UsersThreeFill from '~icons/ph/users-three-fill';

import { SessionStatus, type SessionSummary } from '~/shuttlekaos/model';
import { useMyActiveSessions } from '~/shuttlekaos/queries';

import { BrandHeader } from '../BrandHeader';
import { NewSessionButton } from '../NewSessionButton';
import { useFreshPlayer } from './useFreshPlayer';

import classes from './HomeShell.module.css';

const HomeTab = z.enum(['play', 'lobby', 'stats']);
type HomeTab = z.infer<typeof HomeTab>;

type TabInfo = {
  to: '/shuttlekaos' | '/shuttlekaos/lobby' | '/shuttlekaos/statistikk';
  label: MessageDescriptor;
  icon: ReactNode;
  activeIcon: ReactNode;
};

const TABS: Record<HomeTab, TabInfo> = {
  [HomeTab.enum.play]: {
    to: '/shuttlekaos',
    label: msg({
      message: 'Play',
      context: 'ShuttleKaos: play games',
      comment: 'ShuttleKaos tab: your live and waiting sessions',
    }),
    icon: <PlayCircle />,
    activeIcon: <PlayCircleFill />,
  },
  [HomeTab.enum.lobby]: {
    to: '/shuttlekaos/lobby',
    label: msg({ message: 'Lobby', comment: 'ShuttleKaos tab: public sessions anyone can join or watch' }),
    icon: <UsersThree />,
    activeIcon: <UsersThreeFill />,
  },
  [HomeTab.enum.stats]: {
    to: '/shuttlekaos/statistikk',
    label: msg({ message: 'Your stats', comment: 'ShuttleKaos tab: your results and history' }),
    icon: <ChartBar />,
    activeIcon: <ChartBarFill />,
  },
};

const selectLive = (sessions: SessionSummary[]) => sessions.some((s) => s.status === SessionStatus.enum.running);

type NavProps = { live: boolean; className: string | undefined; iconClassName: string | undefined };

const TabLinks: FC<NavProps> = ({ live, className, iconClassName }) => {
  const { i18n } = useLingui();
  return HomeTab.options.map((tab) => {
    const { to, label, icon, activeIcon } = TABS[tab];
    return (
      <Link key={tab} to={to} className={className} activeOptions={{ exact: true }}>
        {({ isActive }) => (
          <>
            <span className={iconClassName}>
              {isActive ? activeIcon : icon}
              {live && tab === HomeTab.enum.play && <span className={classes.liveDot} aria-hidden />}
            </span>
            {i18n._(label)}
          </>
        )}
      </Link>
    );
  });
};

export const HomeShell: FC = () => {
  const live = useMyActiveSessions({ select: selectLive }).data ?? false;
  const fresh = useFreshPlayer();

  return (
    <>
      <BrandHeader />
      <Container className={classes.shell}>
        <aside className={classes.side}>
          <NewSessionButton size="md" radius="xl" fullWidth className={classes.sideButton} />
          <nav className={classes.nav} aria-label="ShuttleKaos">
            <TabLinks live={live} className={classes.navItem} iconClassName={classes.navIcon} />
          </nav>
        </aside>
        <main className={classes.main}>
          <Outlet />
        </main>
        <div className={classes.dock}>
          <NewSessionButton size="lg" radius="xl" iconOnly={!fresh} className={classes.fab} />
          <nav className={classes.tabbar} aria-label="ShuttleKaos">
            <TabLinks live={live} className={classes.tab} iconClassName={classes.tabPill} />
          </nav>
        </div>
      </Container>
    </>
  );
};
