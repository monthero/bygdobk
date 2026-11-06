import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { EventsShow } from '~/data/events';
import { EventsPage } from '~/pages/events/EventsPage';

export const Route = createFileRoute('/arrangementer/')({
  validateSearch: z.object({
    ar: z.number().int().min(1900).max(2999).optional().catch(undefined),
    vis: EventsShow.optional().catch(undefined),
  }),
  component: EventsPage,
});
