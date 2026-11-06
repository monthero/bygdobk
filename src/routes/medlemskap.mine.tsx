import { createFileRoute } from '@tanstack/react-router';

import { MyMembershipPage } from '~/pages/membership/MyMembershipPage';

export const Route = createFileRoute('/medlemskap/mine')({ component: MyMembershipPage });
