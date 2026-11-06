import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import { Trash, Warning } from '~/components/ui';
import { membershipSeason, type AdminMembership } from '~/memberships/model';
import { membershipErrorMessage, useDeleteMembership } from '~/memberships/queries';

import { memberName, notifyDone } from './format';

const DeleteConfirm: FC<{ membership: AdminMembership; onDone: () => void }> = ({ membership, onDone }) => {
  const { i18n, t } = useLingui();
  const remove = useDeleteMembership();
  const name = memberName(membership);
  const season = membershipSeason(membership).label;

  const confirm = () =>
    remove.mutate(membership.id, {
      onSuccess: () => {
        notifyDone(t`Membership for ${name} deleted`);
        onDone();
      },
    });

  return (
    <Stack gap="md">
      <Text>
        <Trans>
          Delete the membership for <strong>{name}</strong> in season {season}? You can't undo this.
        </Trans>
      </Text>
      {remove.isError && (
        <Alert color="red" variant="light" icon={<Warning />}>
          {i18n._(membershipErrorMessage(remove.error))}
        </Alert>
      )}
      <Group justify="flex-end">
        <Button variant="default" onClick={onDone} data-autofocus>
          <Trans>Cancel</Trans>
        </Button>
        <Button color="red" leftSection={<Trash />} loading={remove.isPending} onClick={confirm}>
          <Trans>Delete</Trans>
        </Button>
      </Group>
    </Stack>
  );
};

type Props = { opened: boolean; membership: AdminMembership | undefined; onClose: () => void };

export const DeleteMembershipModal: FC<Props> = ({ opened, membership, onClose }) => {
  const { t } = useLingui();
  return (
    <Modal opened={opened} onClose={onClose} title={t`Delete membership?`} centered>
      {membership && <DeleteConfirm key={membership.id} membership={membership} onDone={onClose} />}
    </Modal>
  );
};
