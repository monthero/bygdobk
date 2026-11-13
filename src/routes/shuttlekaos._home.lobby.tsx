import { createFileRoute } from '@tanstack/react-router';

import { LobbyPage } from '~/pages/shuttlekaos/home/LobbyPage';

export const Route = createFileRoute('/shuttlekaos/_home/lobby')({ component: LobbyPage });
