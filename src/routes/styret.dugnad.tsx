import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { requireAdmin } from '~/components/auth/guards';
import { VolunteersPage } from '~/pages/board/volunteers/VolunteersPage';

export const Route = createFileRoute('/styret/dugnad')({
  validateSearch: z.object({ arrangement: z.string().min(1).optional().catch(undefined) }),
  beforeLoad: requireAdmin,
  component: VolunteersPage,
});
