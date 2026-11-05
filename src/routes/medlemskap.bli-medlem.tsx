import { createFileRoute } from '@tanstack/react-router';

import { JoinPage } from '~/pages/join/JoinPage';
import { JOIN_SEARCH } from '~/pages/join/offers';

export const Route = createFileRoute('/medlemskap/bli-medlem')({
  validateSearch: JOIN_SEARCH,
  component: JoinPage,
});
