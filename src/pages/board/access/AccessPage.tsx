import type { MessageDescriptor } from '@lingui/core';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Avatar, Badge, Button, Container, Group, Paper, Popover, Skeleton, Stack, Text, Title } from '@mantine/core';
import { Navigate } from '@tanstack/react-router';
import { useCallback, useState, type FC } from 'react';

import { LAST_ADMIN_REASON, SELF_REASON, useBoardAdmins, type BoardAdmin } from '~/access/queries';
import { useSitePhoto } from '~/cms/siteData';
import { AVATAR_IMAGE_PROPS } from '~/components/auth';
import { useSessionUserId, useSignedOut } from '~/components/auth/hooks';
import { PageIntro } from '~/components/styles';
import { Trash } from '~/components/ui';
import { PhotoSlot } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';
import type { BoardProfile } from '~/memberships/model';
import { Author } from '~/pages/board/Author';
import { formatWhen } from '~/pages/board/format';
import { LoadError } from '~/pages/board/LoadError';

import { AddAdminForm } from './AddAdminForm';
import { RemoveAdminModal } from './RemoveAdminModal';

import classes from './AccessPage.module.css';

const SKELETON_ROWS = [0, 1, 2];

const blockedReason = (admin: BoardProfile, userId: string | undefined, count: number) => {
  if (count <= 1) return LAST_ADMIN_REASON;
  if (admin.id === userId) return SELF_REASON;
  return undefined;
};

type RemoveProps = { admin: BoardProfile; blocked: MessageDescriptor | undefined; onRemove: (a: BoardProfile) => void };

const RemoveButton: FC<RemoveProps> = ({ admin, blocked, onRemove }) => {
  const { i18n, t } = useLingui();
  const name = admin.name;
  const button = (
    <Button
      size="compact-sm"
      variant="subtle"
      color="red"
      leftSection={<Trash />}
      aria-label={t`Remove ${name} as admin`}
      data-disabled={blocked ? true : undefined}
      aria-disabled={blocked ? true : undefined}
      onClick={blocked ? undefined : () => onRemove(admin)}
    >
      <Trans comment="Button: take away someone's admin access">Remove</Trans>
    </Button>
  );
  if (!blocked) return button;
  return (
    <Popover width={240} position="top-end" withArrow shadow="md">
      <Popover.Target>{button}</Popover.Target>
      <Popover.Dropdown>
        <Text size="sm">{i18n._(blocked)}</Text>
      </Popover.Dropdown>
    </Popover>
  );
};

const AdminSince: FC<{ admin: BoardAdmin }> = ({ admin: { adminSince, grantedBy } }) => {
  if (!adminSince) return null;
  const day = formatWhen(adminSince);
  const who = <Author person={grantedBy} />;
  return (
    <Text size="xs" c="dimmed">
      <Trans comment="When someone became an admin, and who gave them access. {who} is a name or 'the board'">
        Admin since {day} · added by {who}
      </Trans>
    </Text>
  );
};

type ListProps = { admins: BoardAdmin[]; userId: string | undefined; onRemove: (a: BoardProfile) => void };

const AdminList: FC<ListProps> = ({ admins, userId, onRemove }) => (
  <Paper withBorder radius="md" component="ul" className={classes.admins}>
    {admins.map((admin) => (
      <li key={admin.id} className={classes.admins__item}>
        <Avatar src={admin.avatarUrl} name={admin.name} color="initials" imageProps={AVATAR_IMAGE_PROPS} />
        <div className={classes.admins__who}>
          <Group gap={6} wrap="nowrap">
            <Text fw={600} truncate>
              {admin.name}
            </Text>
            {admin.id === userId && (
              <Badge size="sm" variant="light" className={classes.admins__you}>
                <Trans comment="Badge next to your own name in the admin list">You</Trans>
              </Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed" truncate>
            {admin.email}
          </Text>
          <AdminSince admin={admin} />
        </div>
        <RemoveButton admin={admin} blocked={blockedReason(admin, userId, admins.length)} onRemove={onRemove} />
      </li>
    ))}
  </Paper>
);

const AdminListSkeleton: FC = () => (
  <Stack gap="xs">
    {SKELETON_ROWS.map((i) => (
      <Skeleton key={i} height={56} radius="md" />
    ))}
  </Stack>
);

export const AccessPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`Board access`, t`The board`);
  const photo = useSitePhoto(PhotoSlot.enum.boardAccess);
  const signedOut = useSignedOut();
  const userId = useSessionUserId();
  const admins = useBoardAdmins();
  const [removing, setRemoving] = useState<BoardProfile>();
  const [opened, setOpened] = useState(false);

  const openRemove = useCallback((admin: BoardProfile) => {
    setRemoving(admin);
    setOpened(true);
  }, []);
  const closeRemove = useCallback(() => setOpened(false), []);

  if (signedOut) return <Navigate to="/" replace />;

  return (
    <>
      <PageIntro
        eyebrow={<Trans comment="Eyebrow above the page title: the club board">The board</Trans>}
        photo={photo}
        title={<Trans>Board access</Trans>}
        lede={<Trans>Admins can open the board pages and edit the website.</Trans>}
      />

      <Container py={32}>
        <Stack gap="xl" maw={720}>
          <AddAdminForm admins={admins.data} />
          <Stack gap="xs" component="section" aria-labelledby="admins">
            <Group justify="space-between" align="baseline">
              <Title order={2} size="h4" id="admins">
                <Trans comment="Heading: the people with admin access">Admins</Trans>
              </Title>
              {admins.data && (
                <Text size="sm" c="dimmed">
                  <Plural value={admins.data.length} one="# admin" other="# admins" />
                </Text>
              )}
            </Group>
            {admins.isPending && <AdminListSkeleton />}
            {admins.isError && (
              <LoadError
                title={t`Couldn't load the admins`}
                error={admins.error}
                retrying={admins.isRefetching}
                onRetry={() => void admins.refetch()}
              />
            )}
            {admins.data && <AdminList admins={admins.data} userId={userId} onRemove={openRemove} />}
          </Stack>
        </Stack>
      </Container>

      <RemoveAdminModal opened={opened} admin={removing} onClose={closeRemove} />
    </>
  );
};
