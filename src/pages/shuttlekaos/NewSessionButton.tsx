import { useLingui } from '@lingui/react/macro';
import { Button, type ButtonProps } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { useSessionUserId } from '~/components/auth/hooks';
import { Plus } from '~/components/ui';
import { useUi } from '~/stores/ui';

const selectOpenLogin = (s: ReturnType<typeof useUi.getState>) => s.openLogin;

type Props = Pick<ButtonProps, 'size' | 'radius' | 'fullWidth' | 'className'> & { iconOnly?: boolean };

export const NewSessionButton: FC<Props> = ({ iconOnly, ...props }) => {
  const { t } = useLingui();
  const userId = useSessionUserId();
  const openLogin = useUi(selectOpenLogin);
  const label = t`New session`;
  const shared = { ...props, leftSection: iconOnly ? undefined : <Plus />, 'aria-label': iconOnly ? label : undefined };
  const content = iconOnly ? <Plus /> : label;
  return userId ? (
    <Button {...shared} renderRoot={(root) => <Link {...root} to="/shuttlekaos/ny" />}>
      {content}
    </Button>
  ) : (
    <Button {...shared} onClick={openLogin}>
      {content}
    </Button>
  );
};
