import { Trans, useLingui } from '@lingui/react/macro';
import { Container } from '@mantine/core';
import { Link, useRouterState, type LinkProps, type RouterState } from '@tanstack/react-router';
import { useEffect, useRef, type FC, type ReactNode } from 'react';

import { RequestCountBadge } from '~/components/auth/RequestCountBadge';
import { FolderSimpleLock, HandHeart, IdentificationCard, ShieldCheck } from '~/components/ui';

import classes from './BoardNav.module.css';

const selectPathname = (s: RouterState) => s.location.pathname;
const ACTIVE = { className: classes.link__active, 'aria-current': 'page' } as const;

const NavLink: FC<{ to: LinkProps['to']; icon: ReactNode; children: ReactNode }> = ({ to, icon, children }) => (
  <Link to={to} activeProps={ACTIVE} className={classes.link}>
    {icon}
    {children}
  </Link>
);

export const BoardNav: FC = () => {
  const { t } = useLingui();
  const pathname = useRouterState({ select: selectPathname });
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    const active = inner?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!inner || !active) return;
    inner.scrollLeft = active.offsetLeft - (inner.clientWidth - active.offsetWidth) / 2;
  }, [pathname]);

  return (
    <nav aria-label={t`Board pages`} className={classes.bar}>
      <Container ref={innerRef} className={classes.inner}>
        <span className={classes.label}>
          <FolderSimpleLock aria-hidden />
          <Trans>Board pages</Trans>
        </span>
        <NavLink to="/styret/medlemmer" icon={<IdentificationCard aria-hidden />}>
          <Trans>Memberships</Trans>
          <RequestCountBadge />
        </NavLink>
        <NavLink to="/styret/dugnad" icon={<HandHeart aria-hidden />}>
          <Trans comment="Board screen for volunteer shifts">Volunteers</Trans>
        </NavLink>
        <NavLink to="/styret/tilgang" icon={<ShieldCheck aria-hidden />}>
          <Trans>Board access</Trans>
        </NavLink>
      </Container>
    </nav>
  );
};
