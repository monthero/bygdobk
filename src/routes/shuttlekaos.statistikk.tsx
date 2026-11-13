import { createFileRoute } from '@tanstack/react-router';

import { StatsPage } from '~/pages/shuttlekaos/StatsPage';

export const Route = createFileRoute('/shuttlekaos/statistikk')({ component: StatsPage });
