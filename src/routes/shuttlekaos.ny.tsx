import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { SetupPage } from '~/pages/shuttlekaos/SetupPage';

export const Route = createFileRoute('/shuttlekaos/ny')({
  validateSearch: z.object({
    fra: z.string().min(1).optional().catch(undefined),
    siste: z.boolean().optional().catch(undefined),
  }),
  component: SetupPage,
});
