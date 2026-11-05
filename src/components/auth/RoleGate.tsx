import type { FC, ReactNode } from 'react';

import type { Role } from '~/stores/auth';

import { useRole } from './hooks';

type Props = { role: Role; children: ReactNode; fallback?: ReactNode };

export const RoleGate: FC<Props> = ({ role, children, fallback = null }) => (useRole() === role ? children : fallback);
