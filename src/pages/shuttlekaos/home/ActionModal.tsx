import { Trans, useLingui } from '@lingui/react/macro';
import { Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import { ConfirmActions, ResponsiveModal, SignOut, Trash } from '~/components/ui';
import { notifyDone } from '~/pages/board/format';
import type { SessionSummary } from '~/shuttlekaos/model';
import { shuttleKaosErrorMessage, useDeleteSession, useLeaveSession } from '~/shuttlekaos/queries';

import { BRAND } from '../labels';
import { Action } from './sessionActions';

export const ActionModal: FC<{ action: Action; summary: SessionSummary; onClose: () => void }> = ({
  action,
  summary,
  onClose,
}) => {
  const { t, i18n } = useLingui();
  const deleting = action === Action.enum.delete;
  const remove = useDeleteSession();
  const leave = useLeaveSession();
  const mutation = deleting ? remove : leave;
  const error = mutation.error ? i18n._(shuttleKaosErrorMessage(mutation.error)) : null;
  const title = summary.title || BRAND;

  const confirm = () =>
    mutation.mutate(summary.shareCode, {
      onSuccess: () => {
        notifyDone(deleting ? t`Session deleted.` : t`You're off that session.`);
        onClose();
      },
    });

  return (
    <ResponsiveModal
      opened
      onClose={onClose}
      title={deleting ? <Trans>Delete this session?</Trans> : <Trans>Remove yourself?</Trans>}
    >
      <Stack gap="md">
        <Text>
          {deleting ? (
            <Trans>This removes {title} for everyone, including the players' history. This can't be undone.</Trans>
          ) : (
            <Trans>{title} disappears from your history. The organizer keeps the scores.</Trans>
          )}
        </Text>
        <ConfirmActions
          confirmLabel={deleting ? <Trans>Delete session</Trans> : <Trans>Remove me</Trans>}
          icon={deleting ? <Trash /> : <SignOut />}
          pending={mutation.isPending}
          error={error}
          onCancel={onClose}
          onConfirm={confirm}
        />
      </Stack>
    </ResponsiveModal>
  );
};
