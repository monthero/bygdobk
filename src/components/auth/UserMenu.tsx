import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Alert,
  Avatar,
  Button,
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
  type FloatingPosition,
} from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import {
  ArrowCounterClockwise,
  ArrowUpRight,
  HandHeart,
  IdentificationCard,
  PencilSimple,
  ResponsivePanel,
  SignIn,
  SignOut,
  User as UserIcon,
  UserPlus,
  Warning,
} from '~/components/ui';
import { isCurrent, isOwn, type Membership } from '~/memberships/model';
import { useMyMemberships } from '~/memberships/queries';
import { useUi } from '~/stores/ui';
import { getSupabase } from '~/supabase/client';

import { AVATAR_IMAGE_PROPS } from './avatar';
import { authErrorMessage } from './errors';
import { useAuthReady, useIsAdmin, useProfile, useSessionEmail, useSessionUserId } from './hooks';
import { MyMemberships } from './MyMemberships';
import { ProfileCard } from './ProfileCard';

const EDITOR_PARAMS = { _splat: '' };
const EMPTY_MEMBERSHIPS: Membership[] = [];

const signOut = async () => {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
};

const LoggedOut: FC<{ close: () => void }> = ({ close }) => {
  const openLogin = useUi((s) => s.openLogin);
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
      <Button component={Link} to="/medlemskap/bli-medlem" variant="default" leftSection={<UserPlus />} onClick={close}>
        <Trans>Join the club</Trans>
      </Button>
    </Stack>
  );
};

const LoggedIn: FC<{ close: () => void }> = ({ close }) => {
  const { i18n } = useLingui();
  const email = useSessionEmail();
  const profile = useProfile();
  const isAdmin = useIsAdmin();
  const userId = useSessionUserId();
  const { data: memberships = EMPTY_MEMBERSHIPS } = useMyMemberships();
  const isMember = memberships.some((m) => isOwn(m, userId) && isCurrent(m));
  const logout = useMutation({ mutationFn: signOut, onSuccess: close });
  const user = profile.data;

  return (
    <Stack gap="sm">
      {user && <ProfileCard user={user} isMember={isMember} />}
      <MyMemberships memberships={memberships} />
      {profile.isPending && (
        <Group gap="sm" wrap="nowrap" aria-busy>
          <Skeleton circle height={56} />
          <Stack gap={6} flex={1}>
            <Skeleton height={12} width="60%" />
            <Skeleton height={10} width="80%" />
          </Stack>
        </Group>
      )}
      {profile.isError && (
        <>
          <Alert color="red" variant="light" icon={<Warning />}>
            <Trans>Logged in as {email}, but your profile didn't load.</Trans>
          </Alert>
          <Button
            variant="default"
            leftSection={<ArrowCounterClockwise />}
            loading={profile.isFetching}
            onClick={() => void profile.refetch()}
          >
            <Trans>Try again</Trans>
          </Button>
        </>
      )}
      {isAdmin && (
        <>
          <Divider />
          <Button
            variant="light"
            leftSection={<PencilSimple />}
            rightSection={<ArrowUpRight />}
            onClick={close}
            renderRoot={(props) => (
              <Link {...props} to="/admin/$" params={EDITOR_PARAMS} target="_blank" rel="noopener" />
            )}
          >
            <Trans>Edit the site</Trans>
          </Button>
          <Text size="xs" c="dimmed">
            <Trans>The editor has its own login.</Trans>
          </Text>
          <Group gap="xs" grow>
            <Button
              variant="default"
              size="xs"
              leftSection={<IdentificationCard />}
              onClick={close}
              renderRoot={(props) => <Link {...props} to="/styret/medlemmer" />}
            >
              <Trans>Memberships</Trans>
            </Button>
            <Button
              variant="default"
              size="xs"
              leftSection={<HandHeart />}
              onClick={close}
              renderRoot={(props) => <Link {...props} to="/styret/dugnad" />}
            >
              <Trans comment="Board screen for volunteer shifts">Volunteers</Trans>
            </Button>
          </Group>
        </>
      )}
      <Divider />
      {logout.isError && (
        <Text size="sm" c="red">
          {i18n._(authErrorMessage(logout.error))}
        </Text>
      )}
      <Button
        variant="subtle"
        color="red"
        leftSection={<SignOut />}
        loading={logout.isPending}
        onClick={() => logout.mutate()}
      >
        <Trans>Log out</Trans>
      </Button>
    </Stack>
  );
};

export const AccountButton: FC<{ position?: FloatingPosition }> = ({ position }) => {
  const { t } = useLingui();
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const email = useSessionEmail();
  const profile = useProfile();
  const name = profile.data?.name;
  const label = name ? t`Account menu for ${name}` : t`Account`;

  return (
    <ResponsivePanel
      title={userId ? <Trans>Your account</Trans> : <Trans>Account</Trans>}
      closeLabel={t`Close account menu`}
      position={position}
      renderTarget={(props) =>
        userId ? (
          <ActionIcon variant="subtle" size="lg" radius="xl" aria-label={label} loading={profile.isLoading} {...props}>
            <Avatar
              src={profile.data?.avatarUrl}
              name={name ?? email}
              color="initials"
              size={34}
              imageProps={AVATAR_IMAGE_PROPS}
            />
          </ActionIcon>
        ) : (
          <ActionIcon variant="default" size="lg" radius="md" aria-label={label} loading={!ready} {...props}>
            <UserIcon />
          </ActionIcon>
        )
      }
    >
      {({ close }) => (userId ? <LoggedIn close={close} /> : <LoggedOut close={close} />)}
    </ResponsivePanel>
  );
};
