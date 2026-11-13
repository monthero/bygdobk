import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Box, Button, Group, Menu, Stack, Text } from '@mantine/core';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState, type FC } from 'react';
import { z } from 'zod';

import {
  ArrowCounterClockwise,
  ConfirmActions,
  DotsThreeVertical,
  FlagCheckered,
  LinkSimple,
  QrCode,
  ShareNetwork,
  ResponsiveModal,
  SignOut,
  TelevisionSimple,
  Trash,
} from '~/components/ui';
import { notifyDone } from '~/pages/board/format';
import { SessionStatus } from '~/shuttlekaos/model';
import { shuttleKaosErrorMessage, useDeleteSession, useLeaveSession, type SessionView } from '~/shuttlekaos/queries';

import { InviteLink } from './InviteCard';
import { BRAND, SCAN_LABELS, sessionUrl } from './labels';
import { LinkPlayersModal } from './LinkPlayers';
import { QrImage } from './QrImage';
import { useShareSession } from './useShareSession';

const Confirm = z.enum(['end', 'delete', 'leave', 'link', 'qr']);
type Confirm = z.infer<typeof Confirm>;

type Props = { view: SessionView; hasOpenCourts?: boolean; onEnd?: () => void };

export const SessionMenu: FC<Props> = ({ view, hasOpenCourts, onEnd }) => {
  const { t, i18n } = useLingui();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const remove = useDeleteSession();
  const leave = useLeaveSession();
  const share = useShareSession();
  const { isOwner, myPlayerId, shareCode, session } = view;
  const running = session.status === SessionStatus.enum.running;
  const finished = session.status === SessionStatus.enum.finished;
  const canEnd = isOwner && running && onEnd;
  const canCopy = finished && (isOwner || myPlayerId !== null);
  const canLeave = !isOwner && myPlayerId !== null && !running;
  const url = sessionUrl(shareCode);

  const close = () => {
    setConfirm(null);
    remove.reset();
    leave.reset();
  };

  const destroy = () =>
    remove.mutate(shareCode, {
      onSuccess: () => {
        notifyDone(t`Session deleted.`);
        void navigate({ to: '/shuttlekaos' });
      },
    });

  const quit = () =>
    leave.mutate(shareCode, {
      onSuccess: () => {
        notifyDone(finished ? t`You're off that session.` : t`You left the session.`);
        close();
      },
    });

  const errorOf = (error: Error | null) => (error ? i18n._(shuttleKaosErrorMessage(error)) : null);

  return (
    <>
      <Menu position="bottom-end" width={220}>
        <Menu.Target>
          <ActionIcon variant="subtle" color="gray" radius="xl" size={44} aria-label={t`More`}>
            <DotsThreeVertical />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item hiddenFrom="sm" leftSection={<ShareNetwork />} onClick={() => share(shareCode, session.title)}>
            <Trans>Share the live scores</Trans>
          </Menu.Item>
          <Menu.Item leftSection={<QrCode />} onClick={() => setConfirm(Confirm.enum.qr)}>
            <Trans>Show QR code</Trans>
          </Menu.Item>
          {isOwner && (
            <Menu.Item
              leftSection={<TelevisionSimple />}
              renderRoot={(props) => (
                <Link {...props} to="/shuttlekaos/$code/skjerm" params={{ code: shareCode }} target="_blank" />
              )}
            >
              <Trans comment="Menu item: opens a big-screen view of the session for a TV at the hall">
                Hall screen
              </Trans>
            </Menu.Item>
          )}
          {canEnd && (
            <Menu.Item leftSection={<FlagCheckered />} onClick={() => setConfirm(Confirm.enum.end)}>
              <Trans>End session now</Trans>
            </Menu.Item>
          )}
          {canCopy && (
            <Menu.Item
              leftSection={<ArrowCounterClockwise />}
              onClick={() => void navigate({ to: '/shuttlekaos/ny', search: { fra: shareCode } })}
            >
              <Trans>Set up again</Trans>
            </Menu.Item>
          )}
          {isOwner && finished && (
            <Menu.Item leftSection={<LinkSimple />} onClick={() => setConfirm(Confirm.enum.link)}>
              <Trans>Link players</Trans>
            </Menu.Item>
          )}
          {canLeave && (
            <Menu.Item leftSection={<SignOut />} onClick={() => setConfirm(Confirm.enum.leave)}>
              {finished ? <Trans>Remove me</Trans> : <Trans>Leave session</Trans>}
            </Menu.Item>
          )}
          {isOwner && (
            <Menu.Item color="red" leftSection={<Trash />} onClick={() => setConfirm(Confirm.enum.delete)}>
              <Trans>Delete session</Trans>
            </Menu.Item>
          )}
        </Menu.Dropdown>
      </Menu>

      <ResponsiveModal opened={confirm === Confirm.enum.qr} onClose={close} title={i18n._(SCAN_LABELS[session.status])}>
        <Stack gap="sm" align="center">
          <Box w="min(100%, 400px)">
            <QrImage value={url} label={t`QR code with the session link`} />
          </Box>
          <Text fw={700} ta="center">
            {session.title || BRAND}
          </Text>
          <InviteLink url={url} />
        </Stack>
      </ResponsiveModal>

      {isOwner && finished && <LinkPlayersModal view={view} opened={confirm === Confirm.enum.link} onClose={close} />}

      <ResponsiveModal opened={confirm === Confirm.enum.end} onClose={close} title={<Trans>End the session?</Trans>}>
        <Stack gap="md">
          <Text>
            <Trans>Everyone gets the final standings.</Trans>{' '}
            {hasOpenCourts && <Trans>Courts without a score don't count.</Trans>}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={close} data-autofocus>
              <Trans>Cancel</Trans>
            </Button>
            <Button
              leftSection={<FlagCheckered />}
              onClick={() => {
                onEnd?.();
                close();
              }}
            >
              <Trans>End session</Trans>
            </Button>
          </Group>
        </Stack>
      </ResponsiveModal>

      <ResponsiveModal
        opened={confirm === Confirm.enum.delete}
        onClose={close}
        title={<Trans>Delete this session?</Trans>}
      >
        <Stack gap="md">
          <Text>
            <Trans>This removes the session for everyone, including the players' history. This can't be undone.</Trans>
          </Text>
          <ConfirmActions
            confirmLabel={<Trans>Delete session</Trans>}
            pending={remove.isPending}
            error={errorOf(remove.error)}
            onCancel={close}
            onConfirm={destroy}
          />
        </Stack>
      </ResponsiveModal>

      <ResponsiveModal
        opened={confirm === Confirm.enum.leave}
        onClose={close}
        title={finished ? <Trans>Remove yourself?</Trans> : <Trans>Leave this session?</Trans>}
      >
        <Stack gap="md">
          <Text>
            {finished ? (
              <Trans>The session disappears from your history. The organizer keeps the scores.</Trans>
            ) : (
              <Trans>You can join again while it's still open.</Trans>
            )}
          </Text>
          <ConfirmActions
            confirmLabel={finished ? <Trans>Remove me</Trans> : <Trans>Leave</Trans>}
            icon={<SignOut />}
            pending={leave.isPending}
            error={errorOf(leave.error)}
            onCancel={close}
            onConfirm={quit}
          />
        </Stack>
      </ResponsiveModal>
    </>
  );
};
