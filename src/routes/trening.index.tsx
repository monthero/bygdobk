import { createFileRoute, redirect } from '@tanstack/react-router';

import { loadSiteContent } from '~/cms/content';
import { currentSeason, seasonList } from '~/utils/training';

export const Route = createFileRoute('/trening/')({
  beforeLoad: async ({ search }) => {
    const { events } = await loadSiteContent();
    const { id } = currentSeason(seasonList(events));
    throw redirect({ to: '/trening/$sesong', params: { sesong: id }, search, replace: true });
  },
});
