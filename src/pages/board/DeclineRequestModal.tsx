import { Trans, useLingui } from '@lingui/react/macro';
import { Modal, Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import { ConfirmActions, X } from '~/components/ui';
import { MembershipStatus, type AdminMembership } from '~/memberships/model';
import { membershipErrorMessage, useUpdateMembership } from '~/memberships/queries';

import { memberName, notifyDone } from './format';

const DeclineConfirm: FC<{ membership: AdminMembership; onDone: () => void }> = ({ membership, onDone }) => {
  const { i18n, t } = useLingui();
  const update = useUpdateMembership();
  const name = memberName(membership);

  const confirm = () =>
    update.mutate(
      { id: membership.id, patch: { status: MembershipStatus.enum.declined } },
      {
        onSuccess: () => {
          notifyDone(t`Request from ${name} declined`);
          onDone();
        },
      },
    );

  return (
    <Stack gap="md">
      <Text>
        <Trans>
          Decline the request from <strong>{name}</strong>? It moves to <strong>Show declined</strong>, where you can
          undo it.
        </Trans>
      </Text>
      <ConfirmActions
        confirmLabel={<Trans comment="Button: say no to a membership request">Decline</Trans>}
        icon={<X />}
        pending={update.isPending}
        error={update.isError ? i18n._(membershipErrorMessage(update.error)) : null}
        onCancel={onDone}
        onConfirm={confirm}
      />
    </Stack>
  );
};

type Props = { opened: boolean; membership: AdminMembership | undefined; onClose: () => void };

export const DeclineRequestModal: FC<Props> = ({ opened, membership, onClose }) => {
  const { t } = useLingui();
  return (
    <Modal opened={opened} onClose={onClose} title={t`Decline request?`} centered>
      {membership && <DeclineConfirm key={membership.id} membership={membership} onDone={onClose} />}
    </Modal>
  );
};
