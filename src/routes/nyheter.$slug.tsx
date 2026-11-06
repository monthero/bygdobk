import { createFileRoute, notFound } from '@tanstack/react-router';

import { loadSiteContent } from '~/cms/content';
import { NewsPostPage } from '~/pages/news/NewsPostPage';

export const Route = createFileRoute('/nyheter/$slug')({
  beforeLoad: async ({ params }) => {
    const { news } = await loadSiteContent();
    if (!news.some((p) => p.slug === params.slug)) throw notFound();
  },
  component: NewsPostPage,
});
