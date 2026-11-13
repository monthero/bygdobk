import { Trans, useLingui } from '@lingui/react/macro';
import {
  Badge,
  Button,
  Container,
  Paper,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
  type MantineSize,
} from '@mantine/core';
import type { UseQueryResult } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import { ArrowLeft, Shuttle } from '~/components/ui';
import { LoadError } from '~/pages/board/LoadError';
import type { SessionView } from '~/shuttlekaos/queries';

import classes from './Fallbacks.module.css';

const SKELETON_COURTS = [0, 1];

const SessionSkeleton: FC = () => (
  <Container py="md" aria-busy>
    <Stack gap="md">
      <Skeleton height={28} width="60%" />
      <Skeleton height={14} width="40%" />
      <Skeleton height={44} radius="md" />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {SKELETON_COURTS.map((i) => (
          <Skeleton key={i} height={220} radius="lg" />
        ))}
      </SimpleGrid>
    </Stack>
  </Container>
);

const EmptySession: FC<{ title: ReactNode; text: ReactNode }> = ({ title, text }) => (
  <Container size="xs" py={48}>
    <Paper withBorder radius="lg" p="xl" className={classes.empty}>
      <Stack gap="sm" align="center" ta="center">
        <span className={classes.icon} aria-hidden>
          <Shuttle />
        </span>
        <Title order={1} size="h3">
          {title}
        </Title>
        <Text c="dimmed">{text}</Text>
        <Button
          mt="sm"
          size="md"
          leftSection={<ArrowLeft />}
          renderRoot={(props) => <Link {...props} to="/shuttlekaos" />}
        >
          <Trans>To ShuttleKaos</Trans>
        </Button>
      </Stack>
    </Paper>
  </Container>
);

export const LiveBadge: FC<{ size?: MantineSize; children?: ReactNode }> = ({ size = 'md', children }) => (
  <Badge color="green" variant="light" size={size} leftSection={<span className={classes.dot} />}>
    {children ?? <Trans comment="Badge on a shared session that updates by itself">Live</Trans>}
  </Badge>
);

type GateProps = { view: UseQueryResult<SessionView | null>; children: (data: SessionView) => ReactNode };

export const SessionGate: FC<GateProps> = ({ view, children }) => {
  const { t } = useLingui();
  if (view.isPending) return <SessionSkeleton />;
  if (view.isError) {
    return (
      <Container py="xl">
        <LoadError
          title={t`Couldn't load this session`}
          error={view.error}
          retrying={view.isRefetching}
          onRetry={() => void view.refetch()}
        />
      </Container>
    );
  }
  if (!view.data) {
    return (
      <EmptySession
        title={<Trans>This session doesn't exist anymore</Trans>}
        text={<Trans>The organizer may have deleted it. Start your own instead!</Trans>}
      />
    );
  }
  return children(view.data);
};
