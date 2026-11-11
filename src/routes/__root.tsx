import { createRootRoute, Navigate, Outlet, useRouterState, type RouterState } from '@tanstack/react-router';
import type { FC } from 'react';

import { contentQuery } from '~/cms/content';
import { queryClient } from '~/cms/queryClient';
import { useSignedOut } from '~/components/auth/hooks';
import { ContentError, PageLoader, RootLayout } from '~/components/layout';
import { currentLocale } from '~/i18n/current';
import { isAdminPath } from '~/i18n/locales';
import { usePageViews } from '~/visitors/tracking';

const selectIsAdmin = (s: RouterState) => s.matches.some((m) => m.routeId === '/admin/$');

const AdminOutlet: FC = () => (useSignedOut() ? <Navigate to="/" replace /> : <Outlet />);

const Root: FC = () => {
  usePageViews();
  return useRouterState({ select: selectIsAdmin }) ? <AdminOutlet /> : <RootLayout />;
};

export const Route = createRootRoute({
  loader: ({ location }) =>
    isAdminPath(location.pathname) ? undefined : queryClient.ensureQueryData(contentQuery(currentLocale())),
  component: Root,
  errorComponent: ContentError,
  pendingComponent: PageLoader,
});
