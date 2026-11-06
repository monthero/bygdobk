import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, Container, Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { useAuthReady, useSessionUserId } from '~/components/auth/hooks';
import { MyMemberships } from '~/components/auth/MyMemberships';
import { PageIntro } from '~/components/styles';
import { SignIn, UserPlus } from '~/components/ui';
import { contactLink, ContactTopic } from '~/data/contact';
import { usePageTitle } from '~/hooks/usePageTitle';
import { useMyMemberships } from '~/memberships/queries';
import { LoadError } from '~/pages/board/LoadError';
import { useUi } from '~/stores/ui';

const JoinButton: FC = () => (
  <Button
    variant="default"
    leftSection={<UserPlus />}
    renderRoot={(props) => <Link {...props} to="/medlemskap/bli-medlem" />}
  >
    <Trans>Request a membership</Trans>
  </Button>
);

const Loading: FC = () => (
  <Stack gap="sm" aria-busy>
    <Skeleton height={12} width="30%" />
    <Skeleton height={40} />
  </Stack>
);

const LoggedOut: FC = () => {
  const openLogin = useUi((s) => s.openLogin);
  return (
    <Stack gap="md">
      <Text>
        <Trans>Log in to see your membership and your requests.</Trans>
      </Text>
      <Group gap="sm">
        <Button leftSection={<SignIn />} onClick={openLogin}>
          <Trans>Log in</Trans>
        </Button>
        <JoinButton />
      </Group>
    </Stack>
  );
};

const Mine: FC = () => {
  const { t } = useLingui();
  const mine = useMyMemberships();
  const changeLink = contactLink(ContactTopic.enum.membership, t`Hi! I'd like to change or end my membership.`);

  if (mine.isPending) return <Loading />;
  if (mine.isError) {
    return (
      <LoadError
        title={t`Couldn't load your membership`}
        retrying={mine.isRefetching}
        onRetry={() => void mine.refetch()}
      />
    );
  }

  return (
    <Stack gap="lg">
      <MyMemberships
        memberships={mine.data}
        empty={
          <Text>
            <Trans>No membership yet. Pick a plan and send a request!</Trans>
          </Text>
        }
      />
      <Group gap="sm">
        <JoinButton />
      </Group>
      <Text size="sm" c="dimmed">
        <Trans>
          Want to change or end a membership?{' '}
          <Anchor renderRoot={(props) => <Link {...props} {...changeLink} />}>Write to the board</Anchor>.
        </Trans>
      </Text>
    </Stack>
  );
};

export const MyMembershipPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`My membership`, t`Membership`);
  const ready = useAuthReady();
  const userId = useSessionUserId();

  let body = <Loading />;
  if (ready) body = userId ? <Mine /> : <LoggedOut />;

  return (
    <>
      <PageIntro
        title={<Trans>My membership</Trans>}
        lede={<Trans>Your memberships and requests, all in one spot.</Trans>}
      />
      <Container size="sm" py={40}>
        <Paper withBorder radius="lg" p="lg">
          {body}
        </Paper>
      </Container>
    </>
  );
};
