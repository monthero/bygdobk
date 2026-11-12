import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Menu,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
  VisuallyHidden,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Link, useNavigate } from '@tanstack/react-router';
import { memo, useCallback, useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import { useAuthReady, useSessionUserId } from '~/components/auth/hooks';
import {
  ArrowCounterClockwise,
  ArrowRight,
  Play,
  ConfirmActions,
  DotsThreeVertical,
  ResponsiveModal,
  SignOut,
  Trash,
} from '~/components/ui';
import { usePageTitle } from '~/hooks/usePageTitle';
import { notifyDone } from '~/pages/board/format';
import { LoadError } from '~/pages/board/LoadError';
import { SessionStatus, type SessionSummary } from '~/shuttlekaos/model';
import {
  PAGE_SIZE,
  shuttleKaosErrorMessage,
  useDeleteSession,
  useLeaveSession,
  useMyActiveSessions,
  useMySessionHistory,
} from '~/shuttlekaos/queries';

import { BrandHeader } from './BrandHeader';
import { LiveBadge } from './Fallbacks';
import { BRAND, durationText, formatStart, sessionMinutes, stop, TABLE_QUERY } from './labels';
import { LoginPrompt } from './LoginPrompt';
import { NewSessionButton } from './NewSessionButton';
import { PublicSessions } from './PublicSessions';
import { FormatCell, VisibilityBadge, VisibilityIcon } from './SettingsSummary';
import { useSetupPrefs, type PrefsState } from './setupPrefs';

import tables from './SessionTables.module.css';
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
      <LiveBadge>
        <Trans comment="Session status: being played right now">Live</Trans>
      </LiveBadge>
    );
  }
  return (
    <Badge color="gray" variant="light">
      <Trans comment="Session status">Finished</Trans>
    </Badge>
  );
};

type CardProps = { summary: SessionSummary; onAction: (a: Action, s: SessionSummary) => void };

const SessionCard = memo<CardProps>(({ summary, onAction }) => {
  const navigate = useNavigate();
  const title = summary.title || BRAND;
  const players = summary.playerCount;
  const organizer = summary.organizerName;
  const rank = summary.myResult?.rank;
  const points = summary.myResult?.pointsFor;
  const finished = summary.status === SessionStatus.enum.finished;
  const running = summary.status === SessionStatus.enum.running;
  const go = () => void navigate({ to: '/shuttlekaos/$code', params: { code: summary.shareCode } });

  return (
    <Paper withBorder radius="lg" className={classes.card}>
      <div className={classes.cardHead}>
        <Group gap={6}>
          <StatusBadge status={summary.status} />
          {!summary.isPublic && <VisibilityBadge isPublic={false} />}
        </Group>
        {finished && <PastMenu summary={summary} onAction={onAction} />}
      </div>
      <Link to="/shuttlekaos/$code" params={{ code: summary.shareCode }} className={classes.cardLink}>
        <Text fw={700} size="lg" className={classes.title}>
          {title}
        </Text>
        <Text size="sm" c="dimmed">
          {formatStart(summary.startedAt ?? summary.createdAt)}
          {' · '}
          {summary.isOwner ? (
            <Trans>You organize · {players} players</Trans>
          ) : (
            <Trans>
              By {organizer} · {players} players
            </Trans>
          )}
        </Text>
        {finished && rank !== undefined && (
          <Text size="sm" fw={700}>
            <Trans comment="Your place and points, e.g. You: #2, 84 pts">
              You: #{rank}, {points} pts
            </Trans>
          </Text>
        )}
      </Link>
      {running && (
        <Button size="md" leftSection={<Play />} onClick={go} className={classes.action}>
          <Trans comment="Button on your running session card">Continue</Trans>
        </Button>
      )}
      {summary.status === SessionStatus.enum.open && (
        <Button size="md" variant="default" rightSection={<ArrowRight />} onClick={go} className={classes.action}>
          <Trans>Open</Trans>
        </Button>
      )}
    </Paper>
  );
});

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

const PastMenu: FC<CardProps> = ({ summary, onAction }) => {
  const { t } = useLingui();
  const navigate = useNavigate();
  const title = summary.title || BRAND;
  return (
    <Menu position="bottom-end" width={200}>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          radius="xl"
          size={36}
          aria-label={t`Options for ${title}`}
          onClick={stop}
        >
          <DotsThreeVertical />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown onClick={stop}>
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
  );
};

const PastTable: FC<{ summaries: SessionSummary[]; onAction: CardProps['onAction'] }> = ({ summaries, onAction }) => {
  const navigate = useNavigate();
  return (
    <Paper withBorder radius="lg" className={tables.panel}>
      <Table className={tables.table} verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Trans context="table heading" comment="Table heading: when the session started, in Oslo time">
                Start
              </Trans>
            </Table.Th>
            <Table.Th>
              <Trans comment="Table heading">Session</Trans>
            </Table.Th>
            <Table.Th className={tables.location}>
              <Trans comment="Table heading: where the session is played">Location</Trans>
            </Table.Th>
            <Table.Th>
              <Trans comment="Table heading">Format</Trans>
            </Table.Th>
            <Table.Th>
              <Trans comment="Table heading">Organizer</Trans>
            </Table.Th>
            <Table.Th className={tables.num}>
              <Trans comment="Table heading">Players</Trans>
            </Table.Th>
            <Table.Th className={tables.num}>
              <VisuallyHidden>
                <Trans comment="Table heading for the options menu">Options</Trans>
              </VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {summaries.map((summary) => {
            const minutes = sessionMinutes(summary);
            return (
              <Table.Tr
                key={summary.id}
                className={tables.row}
                onClick={() => void navigate({ to: '/shuttlekaos/$code', params: { code: summary.shareCode } })}
              >
                <Table.Td>
                  <div className={tables.stacked}>
                    {formatStart(summary.startedAt ?? summary.createdAt)}
                    {minutes !== null && minutes > 0 && (
                      <Text size="xs" c="dimmed">
                        {durationText(minutes)}
                      </Text>
                    )}
                  </div>
                </Table.Td>
                <Table.Td className={tables.main}>
                  <Group gap={8} wrap="nowrap">
                    <Link
                      to="/shuttlekaos/$code"
                      params={{ code: summary.shareCode }}
                      className={tables.title}
                      onClick={stop}
                    >
                      {summary.title || BRAND}
                    </Link>
                    <VisibilityIcon isPublic={summary.isPublic} />
                  </Group>
                </Table.Td>
                <Table.Td>{summary.location?.name ?? '–'}</Table.Td>
                <Table.Td>
                  <FormatCell format={summary.format} style={summary.style} levels={summary.levels} />
                </Table.Td>
                <Table.Td>{summary.isOwner ? <Trans>You</Trans> : summary.organizerName}</Table.Td>
                <Table.Td className={tables.num}>{summary.playerCount}</Table.Td>
                <Table.Td className={tables.num}>
                  <PastMenu summary={summary} onAction={onAction} />
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};

const SessionGrid: FC<{ summaries: SessionSummary[]; onAction: CardProps['onAction'] }> = ({ summaries, onAction }) => (
  <div className={classes.grid}>
    {summaries.map((summary) => (
      <SessionCard key={summary.id} summary={summary} onAction={onAction} />
    ))}
  </div>
);

export const StartPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(BRAND);
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const wide = useMediaQuery(TABLE_QUERY);
  const [page, setPage] = useState(1);
  const active = useMyActiveSessions();
  const history = useMySessionHistory(page);
  const mine = active.data ?? EMPTY_SUMMARIES;
  const running = mine.filter((s) => s.status === SessionStatus.enum.running);
  const waiting = mine.filter((s) => s.status === SessionStatus.enum.open);
  const past = history.data?.items ?? EMPTY_SUMMARIES;
  const pages = Math.ceil((history.data?.total ?? 0) / PAGE_SIZE);
  const hasLastSetup = useSetupPrefs(selectHasLineup);
  const [asked, setAsked] = useState<{ action: Action; summary: SessionSummary } | null>(null);
  const ask = useCallback((action: Action, summary: SessionSummary) => setAsked({ action, summary }), []);

  let historySection: ReactNode = null;
  if (userId && history.isPending) {
    historySection = (
      <Section title={<Trans>Past sessions</Trans>}>
        <div className={classes.grid} aria-busy>
          {HISTORY_SKELETONS.map((i) => (
            <Skeleton key={i} height={120} radius="lg" />
          ))}
        </div>
      </Section>
    );
  } else if (userId && history.isError) {
    historySection = (
      <Section title={<Trans>Past sessions</Trans>}>
        <LoadError
          title={t`Couldn't load your sessions`}
          error={history.error}
          retrying={history.isRefetching}
          onRetry={() => void history.refetch()}
        />
      </Section>
    );
  } else if (userId && past.length === 0 && mine.length === 0 && !active.isPending) {
    historySection = (
      <Section title={<Trans>My sessions</Trans>}>
        <Text c="dimmed">
          <Trans>No sessions yet. Start one, or join one, and it lands here.</Trans>
        </Text>
      </Section>
    );
  } else if (past.length > 0) {
    historySection = (
      <Section title={<Trans>Past sessions</Trans>}>
        {wide ? <PastTable summaries={past} onAction={ask} /> : <SessionGrid summaries={past} onAction={ask} />}
        {pages > 1 && <Pagination total={pages} value={page} onChange={setPage} className={tables.pager} />}
      </Section>
    );
  }

  return (
    <>
      <BrandHeader
        lede={<Trans>Made with Bygdø members in mind, but anyone is welcome to play.</Trans>}
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
      <Container className={classes.main}>
        <Stack gap="xl">
          {running.length > 0 && (
            <Section title={<Trans comment="Heading for your sessions being played right now">Playing now</Trans>}>
              <SessionGrid summaries={running} onAction={ask} />
            </Section>
          )}
          {waiting.length > 0 && (
            <Section title={<Trans comment="Heading for your sessions that haven't started">Waiting to start</Trans>}>
              <SessionGrid summaries={waiting} onAction={ask} />
            </Section>
          )}
          <Section title={<Trans>Open sessions</Trans>}>
            <PublicSessions />
          </Section>
          {historySection}
          {ready && !userId && (
            <LoginPrompt>
              <Trans>Log in to start or join sessions and keep your history. Watching works without it.</Trans>
            </LoginPrompt>
          )}
        </Stack>
      </Container>
      {asked && <ActionModal action={asked.action} summary={asked.summary} onClose={() => setAsked(null)} />}
    </>
  );
};
