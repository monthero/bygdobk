import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { loadSiteContent } from '~/cms/content';
import { GROUP_SLUGS } from '~/data/club';
import { TrainingPage } from '~/pages/training/TrainingPage';
import { currentSeason, seasonList } from '~/utils/training';

export const Route = createFileRoute('/trening/$sesong')({
  validateSearch: z.object({ gruppe: GROUP_SLUGS.schema }),
  beforeLoad: async ({ params, search }) => {
    const { events } = await loadSiteContent();
    const seasons = seasonList(events);
    if (!seasons.some((s) => s.id === params.sesong)) throw notFound();
    if (currentSeason(seasons).id === params.sesong) throw redirect({ to: '/trening', search, replace: true });
  },
  component: TrainingPage,
});
