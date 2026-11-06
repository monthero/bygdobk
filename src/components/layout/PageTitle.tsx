import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ThemeIcon } from '@mantine/core';
import { useRouterState, type RouterState } from '@tanstack/react-router';
import type { FC } from 'react';

import { useSiteContent, type SiteContent } from '~/cms/content';
import { ClubLogo } from '~/components/ui';
import { CLUB } from '~/data/club';
import type { FileRoutesById } from '~/routeTree.gen';

import { NAV } from './nav';

import classes from './PageTitle.module.css';

type Detail = (slug: string, content: SiteContent) => MessageDescriptor | string | undefined;

const JOIN = msg`Join the club`;
const MY_MEMBERSHIP = msg`My membership`;
const PRIVACY = msg`Privacy`;
const MEMBERSHIPS = msg({ message: 'Memberships', comment: 'Sticky title of the board page that lists memberships' });

const VOLUNTEER_SHIFTS = msg({
  message: 'Volunteer shifts',
  comment: 'Sticky title of the board page that lists who is on each volunteer shift',
});

const DETAILS: Partial<Record<keyof FileRoutesById, Detail>> = {
  '/nyheter/$slug': (slug, { news }) => news.find((p) => p.slug === slug)?.title,
  '/arrangementer/$slug': (slug, { events }) => events.find((e) => e.slug === slug)?.title,
  '/medlemskap/bli-medlem': () => JOIN,
  '/medlemskap/mine': () => MY_MEMBERSHIP,
  '/styret/medlemmer': () => MEMBERSHIPS,
  '/styret/dugnad': () => VOLUNTEER_SHIFTS,
  '/personvern': () => PRIVACY,
};

const selectPathname = (s: RouterState) => s.location.pathname;
const selectRouteId = (s: RouterState) => s.matches.at(-1)?.routeId;
const selectSlug = (s: RouterState) => {
  const params: Record<string, string | undefined> = s.matches.at(-1)?.params ?? {};
  return params.slug ?? '';
};

const inSection = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`);

export const PageTitle: FC = () => {
  const { i18n } = useLingui();
  const pathname = useRouterState({ select: selectPathname });
  const routeId = useRouterState({ select: selectRouteId });
  const slug = useRouterState({ select: selectSlug });
  const content = useSiteContent();
  const section = NAV.find((item) => inSection(pathname, item.to));
  const detail = routeId ? DETAILS[routeId]?.(slug, content) : undefined;
  const detailText = typeof detail === 'object' ? i18n._(detail) : detail;

  return (
    <div className={classes.root}>
      {section ? (
        <ThemeIcon variant="light" radius="md" size={30}>
          <section.Icon />
        </ThemeIcon>
      ) : (
        <ClubLogo mark height={28} className={classes.logo} />
      )}
      <p className={classes.title}>
        <span className={classes.section}>{section ? i18n._(section.label) : CLUB.name}</span>
        {detailText && (
          <>
            <span className={classes.slash} aria-hidden>
              /
            </span>
            <span className={classes.detail}>{detailText}</span>
          </>
        )}
      </p>
    </div>
  );
};
