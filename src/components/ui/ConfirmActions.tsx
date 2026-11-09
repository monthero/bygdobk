import { Trans } from '@lingui/react/macro';
import { Alert, Button, Group } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { Trash, Warning } from './icons';

type Props = {
  confirmLabel: ReactNode;
  icon?: ReactNode;
  pending: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

const TRASH = <Trash />;

export const ConfirmActions: FC<Props> = ({ confirmLabel, icon = TRASH, pending, error, onCancel, onConfirm }) => (
  <>
    {error && (
      <Alert color="red" variant="light" icon={<Warning />}>
        {error}
      </Alert>
    )}
    <Group justify="flex-end">
      <Button variant="default" onClick={onCancel} data-autofocus>
        <Trans>Cancel</Trans>
      </Button>
      <Button color="red" leftSection={icon} loading={pending} onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </Group>
  </>
);
