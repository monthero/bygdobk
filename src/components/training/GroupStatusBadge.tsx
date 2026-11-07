import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Badge, type MantineColor } from '@mantine/core';
import type { FC } from 'react';

import { GroupStatus } from '~/data/club';

const CLOSED_STATUS: Partial<Record<GroupStatus, { label: MessageDescriptor; color: MantineColor }>> = {
  [GroupStatus.enum.waitlist]: {
    label: msg({ message: 'Waiting list', comment: 'A training group takes new players only from a waiting list' }),
    color: 'yellow',
  },
  [GroupStatus.enum.full]: {
    label: msg({ message: 'Full', comment: 'A training group takes no new players' }),
    color: 'red',
  },
};

export const GroupStatusBadge: FC<{ status: GroupStatus }> = ({ status }) => {
  const { i18n } = useLingui();
  const shown = CLOSED_STATUS[status];
  if (!shown) return null;
  return (
    <Badge color={shown.color} variant="light">
      {i18n._(shown.label)}
    </Badge>
  );
};
