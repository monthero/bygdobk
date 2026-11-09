import type { MessageDescriptor } from '@lingui/core';
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
import { useRef, useState, type FC } from 'react';

import { Camera, Trash } from '~/components/ui';
import type { User } from '~/stores/auth';

import {
  AVATAR_ACCEPT,
  AVATAR_IMAGE_PROPS,
  avatarErrorMessage,
  avatarFileError,
  loadAvatarCropper,
  useRemoveAvatar,
} from './avatar';

const ADMIN_LABEL = msg({ message: 'Admin', comment: 'User role: can edit the site' });
const MEMBER_LABEL = msg({ message: 'Member', comment: 'Badge: has a club membership this season' });

const CAMERA_BADGE = <Camera width={14} height={14} />;
const OVERLAY_LOADER = { size: 'sm' } as const;
const OVERLAY_PROPS = { radius: 'xl' } as const;
type Props = { user: User; isMember: boolean; onPickPhoto: (file: File) => void };

export const ProfileCard: FC<Props> = ({ user, isMember, onPickPhoto }) => {
  const { i18n, t } = useLingui();
  const resetRef = useRef<() => void>(null);
  const [fileError, setFileError] = useState<MessageDescriptor>();
  const remove = useRemoveAvatar();
  const busy = remove.isPending;

  const pick = (file: File | null) => {
    resetRef.current?.();
    if (!file) return;
    remove.reset();
    const problem = avatarFileError(file);
    setFileError(problem);
    if (!problem) onPickPhoto(file);
  };

  return (
    <FileButton onChange={pick} accept={AVATAR_ACCEPT} resetRef={resetRef} disabled={busy}>
      {({ onClick }) => (
        <Stack gap="xs">
          <Group gap="sm" wrap="nowrap" miw={0}>
            <Box pos="relative">
              <UnstyledButton
                onClick={() => {
                  void loadAvatarCropper();
                  onClick();
                }}
                disabled={busy}
                aria-label={t`Change your photo`}
                bdrs="50%"
                display="block"
              >
                <Indicator
                  label={CAMERA_BADGE}
                  size={22}
                  offset={6}
                  position="bottom-end"
                  withBorder
                  color="gray"
                  disabled={busy}
                >
                  <Avatar
                    src={user.avatarUrl}
                    name={user.name}
                    color="initials"
                    size="lg"
                    imageProps={AVATAR_IMAGE_PROPS}
                  />
                </Indicator>
              </UnstyledButton>
              <LoadingOverlay visible={busy} overlayProps={OVERLAY_PROPS} loaderProps={OVERLAY_LOADER} />
            </Box>
            <Stack gap={4} miw={0}>
              <Stack gap={0} miw={0}>
                <Text fw={600} truncate>
                  {user.name}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {user.email}
                </Text>
              </Stack>
              {(isMember || user.isAdmin) && (
                <Group gap={4}>
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
              )}
            </Stack>
          </Group>
          {user.avatarUrl && (
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              w="fit-content"
              leftSection={<Trash />}
              loading={remove.isPending}
              onClick={() => {
                setFileError(undefined);
                remove.mutate();
              }}
            >
              <Trans>Remove photo</Trans>
            </Button>
          )}
          {(fileError || remove.isError) && (
            <Text size="sm" c="red" role="alert">
              {i18n._(fileError ?? avatarErrorMessage(remove.error))}
            </Text>
          )}
        </Stack>
      )}
    </FileButton>
  );
};
