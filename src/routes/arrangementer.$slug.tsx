import { createFileRoute, notFound } from '@tanstack/react-router';
import { z } from 'zod';

import { eventBySlug } from '~/data/events';
import { EventPage } from '~/pages/events/EventPage';

export const Route = createFileRoute('/arrangementer/$slug')({
  validateSearch: z.object({ dag: z.string().optional().catch(undefined) }),
  beforeLoad: ({ params }) => {
    if (!eventBySlug(params.slug)) throw notFound();
  },
  component: EventPage,
});
