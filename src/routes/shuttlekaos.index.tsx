import { createFileRoute } from '@tanstack/react-router';

import { StartPage } from '~/pages/shuttlekaos/StartPage';

export const Route = createFileRoute('/shuttlekaos/')({ component: StartPage });
