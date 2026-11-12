import { Trans } from '@lingui/react/macro';
import { Button, type MantineSize } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { useSessionUserId } from '~/components/auth/hooks';
import { Plus } from '~/components/ui';
import { useUi } from '~/stores/ui';

const selectOpenLogin = (s: ReturnType<typeof useUi.getState>) => s.openLogin;

export const NewSessionButton: FC<{ size?: MantineSize }> = ({ size }) => {
  const userId = useSessionUserId();
  const openLogin = useUi(selectOpenLogin);
  return userId ? (
    <Button size={size} leftSection={<Plus />} renderRoot={(props) => <Link {...props} to="/shuttlekaos/ny" />}>
      <Trans>New session</Trans>
    </Button>
  ) : (
    <Button size={size} leftSection={<Plus />} onClick={openLogin}>
      <Trans>New session</Trans>
    </Button>
  );
};
