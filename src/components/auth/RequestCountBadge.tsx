import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Badge } from '@mantine/core';
import type { FC } from 'react';

import { useOpenRequestCount } from '~/memberships/queries';

export const RequestCountBadge: FC = () => {
  const { t } = useLingui();
  const count = useOpenRequestCount().data ?? 0;
  if (count === 0) return null;
  return (
    <Badge
      size="sm"
      circle
      color="blue"
      aria-label={t`${plural(count, { one: '# open request', other: '# open requests' })}`}
    >
      {count}
    </Badge>
  );
};
