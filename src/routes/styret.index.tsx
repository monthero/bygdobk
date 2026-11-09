import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/styret/')({
  beforeLoad: () => {
    throw redirect({ to: '/styret/medlemmer', replace: true });
  },
});
