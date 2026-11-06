import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { EventsShow } from '~/data/events';
import { EventsPage } from '~/pages/events/EventsPage';

const Year = z.number().int().min(1900).max(2999);

const YEARS_PARAM = z
  .union([Year, z.array(z.unknown())])
  .transform((value) => {
    const years = new Set((Array.isArray(value) ? value : [value]).flatMap((y) => Year.safeParse(y).data ?? []));
    return years.size > 0 ? [...years].sort((a, b) => a - b) : undefined;
  })
  .optional()
  .catch(undefined);

export const Route = createFileRoute('/arrangementer/')({
  validateSearch: z.object({ ar: YEARS_PARAM, vis: EventsShow.optional().catch(undefined) }),
  component: EventsPage,
});
