import { createFileRoute } from '@tanstack/react-router';

import { requireAdmin } from '~/components/auth/guards';
import { AdminStudio } from '~/pages/admin/AdminStudio';

export const Route = createFileRoute('/admin/$')({
  beforeLoad: requireAdmin,
  component: AdminStudio,
});
