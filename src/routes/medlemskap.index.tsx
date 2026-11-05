import { createFileRoute } from '@tanstack/react-router';

import { MembershipPage } from '~/pages/membership/MembershipPage';

export const Route = createFileRoute('/medlemskap/')({ component: MembershipPage });
