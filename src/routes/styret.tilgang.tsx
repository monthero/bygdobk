import { createFileRoute } from '@tanstack/react-router';

import { requireAdmin } from '~/components/auth/guards';
import { AccessPage } from '~/pages/board/access/AccessPage';

export const Route = createFileRoute('/styret/tilgang')({
  beforeLoad: requireAdmin,
  component: AccessPage,
});
