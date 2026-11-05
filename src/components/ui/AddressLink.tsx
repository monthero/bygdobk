import { useLingui } from '@lingui/react/macro';
import { Anchor } from '@mantine/core';
import type { FC } from 'react';

import { FULL_ADDRESS, MAP_LINK } from '~/utils/maps';

export const AddressLink: FC = () => {
  const { t } = useLingui();
  return (
    <Anchor {...MAP_LINK} inherit c="inherit" underline="always" title={t`Open in maps`}>
      {FULL_ADDRESS}
    </Anchor>
  );
};
