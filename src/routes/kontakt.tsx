import { createFileRoute, redirect } from '@tanstack/react-router';

import { CONTACT_HASH, CONTACT_SEARCH } from '~/data/contact';

export const Route = createFileRoute('/kontakt')({
  validateSearch: CONTACT_SEARCH,
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/klubben', search, hash: CONTACT_HASH, replace: true });
  },
});
