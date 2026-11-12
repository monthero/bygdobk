import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Alert,
  Avatar,
  Button,
  Divider,
  Group,
  Indicator,
  Skeleton,
  Stack,
  Switch,
  Text,
  VisuallyHidden,
  type FloatingPosition,
} from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { lazy, Suspense, useState, type FC } from 'react';

import {
  ArrowCounterClockwise,
  ArrowUpRight,
  FolderSimpleLock,
  PencilSimple,
  ResponsivePanel,
  SignIn,
  SignOut,
  User as UserIcon,
  UserPlus,
  Warning,
} from '~/components/ui';
import { isCurrent, isOwn, type Membership } from '~/memberships/model';
import { useMyMemberships, useOpenRequestCount } from '~/memberships/queries';
import { MembersTab } from '~/pages/board/format';
import { shuttleKaosErrorMessage, useFindable, useSetFindable } from '~/shuttlekaos/queries';
import { useUi } from '~/stores/ui';
import { getSupabase } from '~/supabase/client';

import { AVATAR_IMAGE_PROPS, loadAvatarCropper } from './avatar';
import { authErrorMessage } from './errors';
import { useAuthReady, useIsAdmin, useProfile, useSessionEmail, useSessionUserId } from './hooks';
import { MyMemberships } from './MyMemberships';
import { ProfileCard } from './ProfileCard';
import { RequestCountBadge } from './RequestCountBadge';

import classes from './UserMenu.module.css';

const AvatarCropper = lazy(loadAvatarCropper);

const EDITOR_PARAMS = { _splat: '' };
const REQUESTS_SEARCH = { fane: MembersTab.enum.foresporsler };
const EMPTY_MEMBERSHIPS: Membership[] = [];
const PANEL_WIDTH = 340;

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

const FindableSwitch: FC = () => {
  const { i18n } = useLingui();
  const findable = useFindable();
  const change = useSetFindable();
  const checked = change.isPending ? change.variables : (findable.data ?? true);
  return (
    <Stack gap={4}>
      <Switch
        label={<Trans>Others can add me to ShuttleKaos</Trans>}
        description={<Trans>Organizers can find you by name when they set up a session.</Trans>}
        checked={checked}
        disabled={findable.isPending}
        onChange={(e) => change.mutate(e.currentTarget.checked)}
      />
      {change.isError && (
        <Text size="sm" c="red">
          {i18n._(shuttleKaosErrorMessage(change.error))}
        </Text>
      )}
    </Stack>
  );
};

const LoggedIn: FC<{ close: () => void; onPickPhoto: (file: File) => void }> = ({ close, onPickPhoto }) => {
  const { i18n } = useLingui();
  const email = useSessionEmail();
  const profile = useProfile();
  const isAdmin = useIsAdmin();
  const userId = useSessionUserId();
  const { data: memberships = EMPTY_MEMBERSHIPS } = useMyMemberships();
  const isMember = memberships.some((m) => isOwn(m, userId) && isCurrent(m));
  const logout = useMutation({ mutationFn: signOut, onSuccess: close });
  const requestCount = useOpenRequestCount().data ?? 0;
  const user = profile.data;

  return (
    <Stack gap="sm">
      {user && (
        <ProfileCard
          user={user}
          isMember={isMember}
          onPickPhoto={(file) => {
            close();
            onPickPhoto(file);
          }}
        />
      )}
      <MyMemberships memberships={memberships} />
      {user && <FindableSwitch />}
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
            <Trans>Edit site content</Trans>
          </Button>
          <Text size="xs" c="dimmed">
            <Trans>The editor has its own login.</Trans>
          </Text>
          <Button
            variant="default"
            leftSection={<FolderSimpleLock />}
            rightSection={<RequestCountBadge />}
            onClick={close}
            renderRoot={(props) => (
              <Link {...props} to="/styret/medlemmer" search={requestCount > 0 ? REQUESTS_SEARCH : undefined} />
            )}
          >
            <Trans>Board pages</Trans>
          </Button>
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
  const requestCount = useOpenRequestCount().data ?? 0;
  const name = profile.data?.name;
  const account = name ? t`Account menu for ${name}` : t`Account`;
  const requests = t`${plural(requestCount, { one: '# open membership request', other: '# open membership requests' })}`;
  const label = requestCount > 0 ? `${account}, ${requests}` : account;
  const [photo, setPhoto] = useState<File | null>(null);

  return (
    <>
      <ResponsivePanel
        width={PANEL_WIDTH}
        title={userId ? <Trans>Your account</Trans> : <Trans>Account</Trans>}
        closeLabel={t`Close account menu`}
        position={position}
        renderTarget={(props) =>
          userId ? (
            <ActionIcon
              variant="subtle"
              size="lg"
              radius="xl"
              loading={profile.isLoading}
              className={classes.account}
              {...props}
            >
              <VisuallyHidden>{label}</VisuallyHidden>
              <Indicator
                label={requestCount}
                disabled={requestCount === 0}
                size={18}
                offset={2}
                color="blue"
                withBorder
                aria-hidden
              >
                <Avatar
                  src={profile.data?.avatarUrl}
                  name={name ?? email}
                  color="initials"
                  size={34}
                  imageProps={AVATAR_IMAGE_PROPS}
                />
              </Indicator>
            </ActionIcon>
          ) : (
            <ActionIcon variant="default" size="lg" radius="md" aria-label={label} loading={!ready} {...props}>
              <UserIcon />
            </ActionIcon>
          )
        }
      >
        {({ close }) => (userId ? <LoggedIn close={close} onPickPhoto={setPhoto} /> : <LoggedOut close={close} />)}
      </ResponsivePanel>
      {photo && (
        <Suspense fallback={null}>
          <AvatarCropper file={photo} onClose={() => setPhoto(null)} />
        </Suspense>
      )}
    </>
  );
};
