import { useLingui } from '@lingui/react/macro';
import { Badge } from '@mantine/core';
import type { FC } from 'react';

import { TEAMS, type Team } from '~/data/events';

import { TEAM_COLORS } from './shifts';

export const TeamBadge: FC<{ team: Team }> = ({ team }) => {
  const { i18n } = useLingui();
  return (
    <Badge color={TEAM_COLORS[team]} variant="light">
      {i18n._(TEAMS[team].name)}
    </Badge>
  );
};
