import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { GROUP_SLUGS, seasonById } from '~/data/club';
import { TrainingPage } from '~/pages/training/TrainingPage';

export const Route = createFileRoute('/trening/$sesong')({
  validateSearch: z.object({ gruppe: GROUP_SLUGS.schema }),
  beforeLoad: ({ params }) => {
    if (!seasonById(params.sesong)) throw notFound();
  },
  component: TrainingPage,
});
