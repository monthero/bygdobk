import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { NEWS_KIND_SLUGS } from '~/data/news';
import { NewsPage } from '~/pages/news/NewsPage';
import { SEARCH_MAX } from '~/utils/news';

export const Route = createFileRoute('/nyheter/')({
  validateSearch: z.object({
    kategori: NEWS_KIND_SLUGS.schema,
    ar: z.number().int().optional().catch(undefined),
    sok: z
      .string()
      .trim()
      .max(SEARCH_MAX)
      .transform((v) => v || undefined)
      .optional()
      .catch(undefined),
  }),
  component: NewsPage,
});
