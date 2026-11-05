import { createFileRoute, redirect } from '@tanstack/react-router';

import { CURRENT_SEASON } from '~/data/club';

export const Route = createFileRoute('/trening/')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/trening/$sesong', params: { sesong: CURRENT_SEASON.id }, search, replace: true });
  },
});
