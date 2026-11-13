import { createFileRoute } from '@tanstack/react-router';

import { PlayPage } from '~/pages/shuttlekaos/home/PlayPage';

export const Route = createFileRoute('/shuttlekaos/_home/')({ component: PlayPage });
