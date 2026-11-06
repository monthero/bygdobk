import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { requireAdmin } from '~/components/auth/guards';
import { ALL_SEASONS, MembersTab, SEASON_ID } from '~/pages/board/format';
import { MembersPage } from '~/pages/board/MembersPage';

export const Route = createFileRoute('/styret/medlemmer')({
  validateSearch: z.object({
    sesong: z
      .union([z.literal(ALL_SEASONS), z.string().regex(SEASON_ID)])
      .optional()
      .catch(undefined),
    ubetalt: z.boolean().optional().catch(undefined),
    fane: MembersTab.optional().catch(undefined),
    avslatt: z.boolean().optional().catch(undefined),
  }),
  beforeLoad: requireAdmin,
  component: MembersPage,
});
