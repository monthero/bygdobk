import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Avatar,
  Badge,
  Box,
  Button,
  FileButton,
  Group,
  Indicator,
  LoadingOverlay,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useRef, type FC } from 'react';

import { Camera, Trash } from '~/components/ui';
import type { User } from '~/stores/auth';

import { AVATAR_ACCEPT, AVATAR_IMAGE_PROPS, avatarErrorMessage, useChangeAvatar, useRemoveAvatar } from './avatar';

const ADMIN_LABEL = msg({ message: 'Admin', comment: 'User role: can edit the site' });
const MEMBER_LABEL = msg({ message: 'Member', comment: 'Badge: has a club membership this season' });

const CAMERA_BADGE = <Camera width={14} height={14} />;
const OVERLAY_LOADER = { size: 'sm' } as const;
const OVERLAY_PROPS = { radius: 'xl' } as const;

export const ProfileCard: FC<{ user: User; isMember: boolean }> = ({ user, isMember }) => {
  const { i18n, t } = useLingui();
  const resetRef = useRef<() => void>(null);
  const change = useChangeAvatar({ onSettled: () => resetRef.current?.() });
  const remove = useRemoveAvatar();
  const busy = change.isPending || remove.isPending;
  const error = change.error ?? remove.error;

  const pick = (file: File | null) => {
    if (!file) return;
    remove.reset();
    change.mutate(file);
  };

  return (
    <FileButton onChange={pick} accept={AVATAR_ACCEPT} resetRef={resetRef} disabled={busy}>
      {({ onClick }) => (
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap" gap="xs">
            <Group gap="sm" wrap="nowrap" miw={0}>
              <UnstyledButton onClick={onClick} disabled={busy} aria-label={t`Change your photo`} bdrs="50%">
                <Indicator
                  label={CAMERA_BADGE}
                  size={22}
                  offset={6}
                  position="bottom-end"
                  withBorder
                  color="gray"
                  disabled={busy}
                >
                  <Box pos="relative">
                    <Avatar
                      src={user.avatarUrl}
                      name={user.name}
                      color="initials"
                      size="lg"
                      imageProps={AVATAR_IMAGE_PROPS}
                    />
                    <LoadingOverlay visible={busy} overlayProps={OVERLAY_PROPS} loaderProps={OVERLAY_LOADER} />
                  </Box>
                </Indicator>
              </UnstyledButton>
              <Stack gap={0} miw={0}>
                <Text fw={600} truncate>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </Stack>
            </Group>
            <Group gap={4} wrap="nowrap">
              {isMember && (
                <Badge color="teal" variant="light">
                  {i18n._(MEMBER_LABEL)}
                </Badge>
              )}
              {user.isAdmin && (
                <Badge color="grape" variant="light">
                  {i18n._(ADMIN_LABEL)}
                </Badge>
              )}
            </Group>
          </Group>
          <Group gap="xs" grow>
            <Button
              size="xs"
              variant="default"
              leftSection={<Camera />}
              loading={change.isPending}
              disabled={remove.isPending}
              onClick={onClick}
            >
              <Trans>Change photo</Trans>
            </Button>
            {user.avatarUrl && (
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<Trash />}
                loading={remove.isPending}
                disabled={change.isPending}
                onClick={() => {
                  change.reset();
                  remove.mutate();
                }}
              >
                <Trans>Remove photo</Trans>
              </Button>
            )}
          </Group>
          {error && (
            <Text size="sm" c="red" role="alert">
              {i18n._(avatarErrorMessage(error))}
            </Text>
          )}
        </Stack>
      )}
    </FileButton>
  );
};
