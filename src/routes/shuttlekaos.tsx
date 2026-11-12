import { createFileRoute } from '@tanstack/react-router';

import { ShuttleKaosLayout } from '~/pages/shuttlekaos/ShuttleKaosLayout';

export const Route = createFileRoute('/shuttlekaos')({ component: ShuttleKaosLayout });
