import { createFileRoute, Outlet } from '@tanstack/react-router';

import { requireAdmin } from '~/components/auth/guards';
import { BoardNav } from '~/pages/board/BoardNav';

const BoardLayout = () => (
  <>
    <BoardNav />
    <Outlet />
  </>
);

export const Route = createFileRoute('/styret')({
  beforeLoad: requireAdmin,
  component: BoardLayout,
});
