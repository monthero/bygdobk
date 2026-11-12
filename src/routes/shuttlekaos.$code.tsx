import { createFileRoute } from '@tanstack/react-router';

import { SessionPage } from '~/pages/shuttlekaos/SessionPage';

export const Route = createFileRoute('/shuttlekaos/$code')({ component: SessionPage });
