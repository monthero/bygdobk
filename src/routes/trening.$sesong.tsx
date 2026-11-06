import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { loadSiteContent } from '~/cms/content';
import { GROUP_SLUGS } from '~/data/club';
import { TrainingPage } from '~/pages/training/TrainingPage';
import { seasonList } from '~/utils/training';

export const Route = createFileRoute('/trening/$sesong')({
  validateSearch: z.object({ gruppe: GROUP_SLUGS.schema }),
  beforeLoad: async ({ params }) => {
    const { events } = await loadSiteContent();
    if (!seasonList(events).some((s) => s.id === params.sesong)) throw notFound();
  },
  component: TrainingPage,
});
