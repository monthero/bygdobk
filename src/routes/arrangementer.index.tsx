import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { EVENT_YEARS, EventsShow } from '~/data/events';
import { EventsPage } from '~/pages/events/EventsPage';

const YEARS_PARAM = z
  .union([z.number(), z.array(z.unknown())])
  .transform((value) => {
    const picked = new Set(Array.isArray(value) ? value : [value]);
    const years = EVENT_YEARS.filter((y) => picked.has(y));
    return years.length > 0 ? years : undefined;
  })
  .optional()
  .catch(undefined);

export const Route = createFileRoute('/arrangementer/')({
  validateSearch: z.object({ ar: YEARS_PARAM, vis: EventsShow.optional().catch(undefined) }),
  component: EventsPage,
});
