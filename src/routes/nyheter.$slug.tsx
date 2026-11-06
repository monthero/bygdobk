import { createFileRoute, notFound } from '@tanstack/react-router';

import { loadSiteContent, newsBodyQuery } from '~/cms/content';
import { queryClient } from '~/cms/queryClient';
import { currentLocale } from '~/i18n/current';
import { NewsPostPage } from '~/pages/news/NewsPostPage';

export const Route = createFileRoute('/nyheter/$slug')({
  beforeLoad: async ({ params }) => {
    const { news } = await loadSiteContent();
    if (!news.some((p) => p.slug === params.slug)) throw notFound();
  },
  loader: ({ params }) => queryClient.ensureQueryData(newsBodyQuery(params.slug, currentLocale())),
  component: NewsPostPage,
});
