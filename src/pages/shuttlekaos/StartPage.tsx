import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Menu,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { Link, useNavigate } from '@tanstack/react-router';
import { memo, useCallback, useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import { useAuthReady, useSessionUserId } from '~/components/auth/hooks';
import {
  ArrowCounterClockwise,
  ArrowRight,
  ConfirmActions,
  DotsThreeVertical,
  ResponsiveModal,
  SignOut,
  Trash,
} from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { formatWhen, notifyDone } from '~/pages/board/format';
import { LoadError } from '~/pages/board/LoadError';
import { SessionStatus, type SessionSummary } from '~/shuttlekaos/model';
import { shuttleKaosErrorMessage, useDeleteSession, useLeaveSession, useMySessions } from '~/shuttlekaos/queries';

import { BrandHeader } from './BrandHeader';
import { BRAND, TAGLINE } from './labels';
import { LoginPrompt } from './LoginPrompt';
import { NewSessionButton } from './NewSessionButton';
import { PublicSessions } from './PublicSessions';
import { VisibilityBadge } from './SettingsSummary';
import { useSetupPrefs, type PrefsState } from './setupPrefs';

import classes from './StartPage.module.css';

const Action = z.enum(['leave', 'delete']);
type Action = z.infer<typeof Action>;

const HISTORY_SKELETONS = [0, 1, 2];

const selectHasLineup = (s: PrefsState) => s.lineup !== null;
const EMPTY_SUMMARIES: SessionSummary[] = [];

const Section: FC<{ title: ReactNode; children: ReactNode }> = ({ title, children }) => (
  <Stack component="section" gap="sm">
    <Title order={2} size="h4">
      {title}
    </Title>
    {children}
  </Stack>
);

const StatusBadge: FC<{ status: SessionStatus }> = ({ status }) => {
  if (status === SessionStatus.enum.open) {
    return (
      <Badge color="teal" variant="light">
        <Trans comment="Session status: people can still join">Open</Trans>
      </Badge>
    );
  }
  if (status === SessionStatus.enum.running) {
    return (
      <Badge color="red" variant="light">
        <Trans comment="Session status: being played right now">Live</Trans>
      </Badge>
    );
  }
  return (
    <Badge color="gray" variant="light">
      <Trans comment="Session status">Finished</Trans>
    </Badge>
  );
};

const CurrentCard: FC<{ summary: SessionSummary }> = ({ summary }) => {
  const players = summary.playerCount;
  const organizer = summary.organizerName;
  return (
    <Paper
      withBorder
      radius="lg"
      className={classes.current}
      renderRoot={(props) => <Link {...props} to="/shuttlekaos/$code" params={{ code: summary.shareCode }} />}
    >
      <div className={classes.currentText}>
        <Group gap={6}>
          <StatusBadge status={summary.status} />
          {!summary.isPublic && <VisibilityBadge isPublic={false} />}
        </Group>
        <Text fw={700} size="lg" className={classes.title}>
          {summary.title || BRAND}
        </Text>
        <Text size="sm" c="dimmed">
          {summary.isOwner ? (
            <Trans>You organize · {players} players</Trans>
          ) : (
            <Trans>
              By {organizer} · {players} players
            </Trans>
          )}
        </Text>
      </div>
      <span className={classes.go}>
        <Trans>Open</Trans>
        <ArrowRight />
      </span>
    </Paper>
  );
};

const HistoryRow = memo<{ summary: SessionSummary; onAction: (a: Action, s: SessionSummary) => void }>(
  ({ summary, onAction }) => {
    const { t } = useLingui();
    const navigate = useNavigate();
    const title = summary.title || BRAND;
    const players = summary.playerCount;
    const rank = summary.myResult?.rank;
    const points = summary.myResult?.pointsFor;
    return (
      <li className={classes.row}>
        <UnstyledButton
          className={classes.rowLink}
          renderRoot={(props) => <Link {...props} to="/shuttlekaos/$code" params={{ code: summary.shareCode }} />}
        >
          <Text size="sm" c="dimmed" className={classes.when}>
            {formatWhen(summary.createdAt)}
          </Text>
          <span className={classes.rowMain}>
            <Text fw={700} className={classes.title}>
              {title}
            </Text>
            <Text size="sm" c="dimmed">
              <Trans>{players} players</Trans>
              {rank !== undefined && (
                <>
                  {' · '}
                  <Trans comment="Your place and points, e.g. You: #2, 84 pts">
                    You: #{rank}, {points} pts
                  </Trans>
                </>
              )}
            </Text>
          </span>
          <StatusBadge status={summary.status} />
        </UnstyledButton>
        <Menu position="bottom-end" width={200}>
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" radius="xl" size={44} aria-label={t`Options for ${title}`}>
              <DotsThreeVertical />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<ArrowCounterClockwise />}
              onClick={() => void navigate({ to: '/shuttlekaos/ny', search: { fra: summary.shareCode } })}
            >
              <Trans>Set up again</Trans>
            </Menu.Item>
            {summary.isOwner ? (
              <Menu.Item color="red" leftSection={<Trash />} onClick={() => onAction(Action.enum.delete, summary)}>
                <Trans>Delete session</Trans>
              </Menu.Item>
            ) : (
              <Menu.Item leftSection={<SignOut />} onClick={() => onAction(Action.enum.leave, summary)}>
                <Trans>Remove me</Trans>
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </li>
    );
  },
);

const ActionModal: FC<{ action: Action; summary: SessionSummary; onClose: () => void }> = ({
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

const History: FC<{ summaries: SessionSummary[]; pending: boolean; error: ReactNode }> = ({
  summaries,
  pending,
  error,
}) => {
  const [asked, setAsked] = useState<{ action: Action; summary: SessionSummary } | null>(null);
  const ask = useCallback((action: Action, summary: SessionSummary) => setAsked({ action, summary }), []);

  let body: ReactNode;
  if (pending) {
    body = (
      <Stack gap={8} aria-busy>
        {HISTORY_SKELETONS.map((i) => (
          <Skeleton key={i} height={64} radius="md" />
        ))}
      </Stack>
    );
  } else if (error) {
    body = error;
  } else if (summaries.length === 0) {
    body = (
      <Text c="dimmed">
        <Trans>No sessions yet. Start one, or join one, and it lands here.</Trans>
      </Text>
    );
  } else {
    body = (
      <Paper withBorder radius="lg" className={classes.history}>
        <ul className={classes.rows}>
          {summaries.map((summary) => (
            <HistoryRow key={summary.id} summary={summary} onAction={ask} />
          ))}
        </ul>
      </Paper>
    );
  }

  return (
    <Section title={<Trans>My sessions</Trans>}>
      {body}
      {asked && <ActionModal action={asked.action} summary={asked.summary} onClose={() => setAsked(null)} />}
    </Section>
  );
};

export const StartPage: FC = () => {
  const { t, i18n } = useLingui();
  usePageTitle(i18n._(TAGLINE), BRAND);
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const mine = useMySessions();
  const summaries = mine.data ?? EMPTY_SUMMARIES;
  const active = summaries.find((s) => s.isActive);
  const past = summaries.filter((s) => s !== active);
  const hasLastSetup = useSetupPrefs(selectHasLineup);

  return (
    <>
      <BrandHeader
        actions={
          <>
            <NewSessionButton />
            {userId && hasLastSetup && (
              <Button
                variant="default"
                leftSection={<ArrowCounterClockwise />}
                renderRoot={(props) => <Link {...props} to="/shuttlekaos/ny" search={{ siste: true }} />}
              >
                <Trans>Use last setup</Trans>
              </Button>
            )}
          </>
        }
      />
      <Container size="md" py="lg">
        <Stack gap="xl">
          {active && (
            <Section title={<Trans>Your current session</Trans>}>
              <CurrentCard summary={active} />
            </Section>
          )}
          <Section title={<Trans>Open sessions</Trans>}>
            <PublicSessions />
          </Section>
          {userId && (
            <History
              summaries={past}
              pending={mine.isPending}
              error={
                mine.isError && (
                  <LoadError
                    title={t`Couldn't load your sessions`}
                    error={mine.error}
                    retrying={mine.isRefetching}
                    onRetry={() => void mine.refetch()}
                  />
                )
              }
            />
          )}
          {ready && !userId && (
            <LoginPrompt>
              <Trans>Log in to start or join sessions and keep your history. Watching works without it.</Trans>
            </LoginPrompt>
          )}
        </Stack>
      </Container>
    </>
  );
};
