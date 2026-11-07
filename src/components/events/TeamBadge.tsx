import { Badge } from '@mantine/core';
import type { FC } from 'react';

import { useTeams } from '~/cms/siteData';
import type { Team } from '~/data/events';

import { TEAM_COLORS } from './shifts';

export const TeamBadge: FC<{ team: Team }> = ({ team }) => {
  const teams = useTeams();
  return (
    <Badge color={TEAM_COLORS[team]} variant="light">
      {teams[team].name}
    </Badge>
  );
};
