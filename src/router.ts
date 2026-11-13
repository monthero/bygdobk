import { createRouter } from '@tanstack/react-router';

import { ContentError } from './components/layout';
import { localeRewrite } from './i18n/url';
import { NotFoundPage } from './pages/NotFoundPage';
import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  rewrite: localeRewrite,
  scrollRestoration: true,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: ContentError,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
