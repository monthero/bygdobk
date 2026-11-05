import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Stack,
  Switch,
  Text,
  type FloatingPosition,
  type MantineColor,
} from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { GearSix, ResponsivePanel, SignIn, SignOut, User as UserIcon, UserPlus } from '~/components/ui';
import { Role, useAuth } from '~/stores/auth';
import { useUi } from '~/stores/ui';

import { useUser } from './hooks';

const ROLE_LABELS: Record<Role, MessageDescriptor> = {
  [Role.enum.admin]: msg({ message: 'Admin', comment: 'User role: can edit the site' }),
  [Role.enum.member]: msg({ message: 'Member', comment: 'User role: club member' }),
};

const ROLE_COLORS: Record<Role, MantineColor> = {
  [Role.enum.admin]: 'grape',
  [Role.enum.member]: 'teal',
};

const AccountContent: FC<{ close: () => void }> = ({ close }) => {
  const { i18n, t } = useLingui();
  const user = useUser();
  const editMode = useAuth((s) => s.editMode);
  const setEditMode = useAuth((s) => s.setEditMode);
  const logout = useAuth((s) => s.logout);
  const openLogin = useUi((s) => s.openLogin);

  if (!user) {
    return (
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          <Trans>Log in to sign up for volunteer shifts. Board members can edit the site.</Trans>
        </Text>
        <Button
          leftSection={<SignIn />}
          onClick={() => {
            close();
            openLogin();
          }}
        >
          <Trans>Log in</Trans>
        </Button>
        <Button
          component={Link}
          to="/medlemskap/bli-medlem"
          variant="default"
          leftSection={<UserPlus />}
          onClick={close}
        >
          <Trans>Join the club</Trans>
        </Button>
      </Stack>
    );
  }

  const { name, email, role } = user;
  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group gap="sm" wrap="nowrap" miw={0}>
          <Avatar name={name} color="initials" />
          <Stack gap={0} miw={0}>
            <Text fw={600} truncate>
              {name}
            </Text>
            <Text size="xs" c="dimmed" truncate>
              {email}
            </Text>
          </Stack>
        </Group>
        <Badge color={ROLE_COLORS[role]} variant="light">
          {i18n._(ROLE_LABELS[role])}
        </Badge>
      </Group>
      {role === Role.enum.admin && (
        <>
          <Divider />
          <Switch
            label={t`Edit mode`}
            description={t`Edit content on the pages`}
            checked={editMode}
            onChange={(e) => setEditMode(e.currentTarget.checked)}
          />
          <Button component={Link} to="/admin" variant="default" leftSection={<GearSix />} onClick={close}>
            <Trans>Admin panel</Trans>
          </Button>
        </>
      )}
      <Divider />
      <Button
        variant="subtle"
        color="red"
        leftSection={<SignOut />}
        onClick={() => {
          logout();
          close();
        }}
      >
        <Trans>Log out</Trans>
      </Button>
    </Stack>
  );
};

export const AccountButton: FC<{ position?: FloatingPosition }> = ({ position }) => {
  const { t } = useLingui();
  const user = useUser();
  const label = user ? t`Account menu for ${user.name}` : t`Account`;

  return (
    <ResponsivePanel
      title={user ? <Trans>Your account</Trans> : <Trans>Account</Trans>}
      closeLabel={t`Close account menu`}
      position={position}
      renderTarget={(props) =>
        user ? (
          <ActionIcon variant="subtle" size="lg" radius="xl" aria-label={label} {...props}>
            <Avatar name={user.name} color="initials" size={34} />
          </ActionIcon>
        ) : (
          <ActionIcon variant="default" size="lg" radius="md" aria-label={label} {...props}>
            <UserIcon />
          </ActionIcon>
        )
      }
    >
      {({ close }) => <AccountContent close={close} />}
    </ResponsivePanel>
  );
};
