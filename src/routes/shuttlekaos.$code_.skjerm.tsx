import { createFileRoute } from '@tanstack/react-router';

import { HallScreen } from '~/pages/shuttlekaos/HallScreen';

export const Route = createFileRoute('/shuttlekaos/$code_/skjerm')({ component: HallScreen });
