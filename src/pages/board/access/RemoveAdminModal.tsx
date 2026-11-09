import { Trans, useLingui } from '@lingui/react/macro';
import { Modal, Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import { accessErrorMessage, useRevokeAdmin } from '~/access/queries';
import { ConfirmActions } from '~/components/ui';
import type { BoardProfile } from '~/memberships/model';
import { notifyDone } from '~/pages/board/format';

const RemoveConfirm: FC<{ admin: BoardProfile; onDone: () => void }> = ({ admin, onDone }) => {
  const { i18n, t } = useLingui();
  const revoke = useRevokeAdmin();
  const name = admin.name;

  const confirm = () =>
    revoke.mutate(admin.id, {
      onSuccess: () => {
        notifyDone(t`${name} is no longer an admin`);
        onDone();
      },
    });

  return (
    <Stack gap="md">
      <Text>
        <Trans>
          <strong>{name}</strong> can no longer open the board pages or edit the website. Their account and memberships
          stay.
        </Trans>
      </Text>
      <ConfirmActions
        confirmLabel={<Trans comment="Button: take away someone's admin access">Remove</Trans>}
        pending={revoke.isPending}
        error={revoke.isError ? i18n._(accessErrorMessage(revoke.error)) : null}
        onCancel={onDone}
        onConfirm={confirm}
      />
    </Stack>
  );
};

type Props = { opened: boolean; admin: BoardProfile | undefined; onClose: () => void };

export const RemoveAdminModal: FC<Props> = ({ opened, admin, onClose }) => {
  const { t } = useLingui();
  return (
    <Modal opened={opened} onClose={onClose} title={t`Remove admin?`} centered>
      {admin && <RemoveConfirm key={admin.id} admin={admin} onDone={onClose} />}
    </Modal>
  );
};
