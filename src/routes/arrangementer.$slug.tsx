import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { loadSiteContent } from '~/cms/content';
import { isVisitorEvent } from '~/components/events/eventMeta';
import { EventPage } from '~/pages/events/EventPage';

export const Route = createFileRoute('/arrangementer/$slug')({
  validateSearch: z.object({ dag: z.iso.date().optional().catch(undefined) }),
  beforeLoad: async ({ params }) => {
    const { events } = await loadSiteContent();
    if (!events.some((e) => isVisitorEvent(e) && e.slug === params.slug)) throw notFound();
  },
  component: EventPage,
});
