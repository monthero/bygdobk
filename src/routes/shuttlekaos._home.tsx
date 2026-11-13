import { createFileRoute } from '@tanstack/react-router';

import { HomeShell } from '~/pages/shuttlekaos/home/HomeShell';

export const Route = createFileRoute('/shuttlekaos/_home')({ component: HomeShell });
