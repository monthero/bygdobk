import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { NEWS_KIND_SLUGS } from '~/data/news';
import { NewsPage } from '~/pages/news/NewsPage';

export const Route = createFileRoute('/nyheter/')({
  validateSearch: z.object({ kategori: NEWS_KIND_SLUGS.schema }),
  component: NewsPage,
});
