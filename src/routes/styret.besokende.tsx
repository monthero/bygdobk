import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { requireAdmin } from '~/components/auth/guards';
import { VisitorsPage } from '~/pages/board/visitors/VisitorsPage';
import { VisitPeriod } from '~/visitors/model';

export const Route = createFileRoute('/styret/besokende')({
  validateSearch: z.object({ periode: VisitPeriod.optional().catch(undefined) }),
  beforeLoad: requireAdmin,
  component: VisitorsPage,
});
