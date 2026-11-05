import { createFileRoute } from '@tanstack/react-router';

import { ClubPage } from '~/pages/club/ClubPage';

export const Route = createFileRoute('/klubben/')({ component: ClubPage });
