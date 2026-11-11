import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { GROUP_SLUGS } from '~/data/club';
import { TrainingPage } from '~/pages/training/TrainingPage';

export const Route = createFileRoute('/trening/')({
  validateSearch: z.object({ gruppe: GROUP_SLUGS.schema }),
  component: TrainingPage,
});
