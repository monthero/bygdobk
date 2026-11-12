import { useLingui } from '@lingui/react/macro';
import { ActionIcon, Tooltip } from '@mantine/core';
import type { FC } from 'react';

import { ShareNetwork } from '~/components/ui';

import { useShareSession } from './useShareSession';

export const ShareButton: FC<{ code: string; title: string }> = ({ code, title }) => {
  const { t } = useLingui();
  const share = useShareSession();
  const label = t`Share the live scores`;
  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="default"
        radius="xl"
        size={44}
        visibleFrom="sm"
        aria-label={label}
        onClick={() => share(code, title)}
      >
        <ShareNetwork />
      </ActionIcon>
    </Tooltip>
  );
};
