import { createFileRoute } from '@tanstack/react-router';

import { CONTACT_SEARCH } from '~/data/contact';
import { ClubPage } from '~/pages/club/ClubPage';

export const Route = createFileRoute('/klubben/')({ validateSearch: CONTACT_SEARCH, component: ClubPage });
