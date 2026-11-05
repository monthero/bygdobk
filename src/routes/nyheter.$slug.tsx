import { createFileRoute, notFound } from '@tanstack/react-router';

import { newsBySlug } from '~/data/news';
import { NewsPostPage } from '~/pages/news/NewsPostPage';

export const Route = createFileRoute('/nyheter/$slug')({
  beforeLoad: ({ params }) => {
    if (!newsBySlug(params.slug)) throw notFound();
  },
  component: NewsPostPage,
});
