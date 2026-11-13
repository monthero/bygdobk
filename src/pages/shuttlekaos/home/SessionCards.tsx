import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Badge,
  Button,
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
import { memo, useState, type FC, type ReactNode } from 'react';

import { useSessionUserId } from '~/components/auth/hooks';
import { ArrowCounterClockwise, ArrowRight, DotsThreeVertical, Play, SignOut, Trash } from '~/components/ui';
import { LoadError } from '~/pages/board/LoadError';
import { SessionStatus, type SessionSummary } from '~/shuttlekaos/model';
import { PAGE_SIZE, useMySessionHistory } from '~/shuttlekaos/queries';

import { LiveBadge } from '../Fallbacks';
import { BRAND, durationText, formatStart, sessionMinutes, sessionTimeText, stop, TABLE_QUERY } from '../labels';
import { Place } from '../PublicSessions';
import { SessionLink, SessionRow, SessionTable } from '../SessionTable';
import { FormatCell, PlayersText, SessionChips, VisibilityBadge, VisibilityIcon } from '../SettingsSummary';
import { ActionModal } from './ActionModal';
import { Action, useSessionActions } from './sessionActions';

import tables from '../SessionTables.module.css';
import classes from './SessionCards.module.css';

const HISTORY_SKELETONS = [0, 1, 2];

const EMPTY_SUMMARIES: SessionSummary[] = [];

export const HomeSection: FC<{ title: ReactNode; action?: ReactNode; children: ReactNode }> = ({
  title,
  action,
  children,
}) => (
  <Stack component="section" gap="sm">
    <div className={classes.sectionHead}>
      <Title order={2} size="h4">
        {title}
      </Title>
      {action}
    </div>
    {children}
  </Stack>
);

const StatusBadge: FC<{ status: SessionStatus }> = ({ status }) => {
  if (status === SessionStatus.enum.open) {
    return (
      <Badge color="teal" variant="light">
        <Trans comment="Session status: people can still join">Open to join</Trans>
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

export type CardProps = { summary: SessionSummary; onAction?: (a: Action, s: SessionSummary) => void };

export const SessionCard = memo<CardProps>(({ summary, onAction }) => {
  const navigate = useNavigate();
  const title = summary.title || BRAND;
  const when = sessionTimeText(summary);
  const organizer = summary.organizerName;
  const rank = summary.myResult?.rank;
  const points = summary.myResult?.pointsFor;
  const finished = summary.status === SessionStatus.enum.finished;
  const running = summary.status === SessionStatus.enum.running;
  const go = () => void navigate({ to: '/shuttlekaos/$code', params: { code: summary.shareCode } });

  return (
    <Paper withBorder radius="lg" className={classes.card} data-status={summary.status}>
      <div className={classes.cardHead}>
        <Group gap={6}>
          <StatusBadge status={summary.status} />
          {!summary.isPublic && <VisibilityBadge isPublic={false} />}
        </Group>
        {finished && onAction && <PastMenu summary={summary} onAction={onAction} />}
      </div>
      <Link to="/shuttlekaos/$code" params={{ code: summary.shareCode }} className={classes.cardLink}>
        <Text fw={700} size="lg" className={classes.title}>
          {title}
        </Text>
        <Text size="sm" c="dimmed" className={classes.metaLine}>
          {when && <span>{when}</span>}
          <span>
            {summary.isOwner ? (
              <Trans comment="On your session card: you are the organizer">You organize</Trans>
            ) : (
              <Trans comment="Who organizes a session">By {organizer}</Trans>
            )}
          </span>
          <span>
            <PlayersText playerCount={summary.playerCount} maxPlayers={summary.maxPlayers} />
          </span>
        </Text>
        {finished && rank !== undefined && (
          <Text size="sm" fw={700}>
            <Trans comment="Your place and points, e.g. You: #2, 84 pts">
              You: #{rank}, {points} pts
            </Trans>
          </Text>
        )}
        <Place location={summary.location} />
      </Link>
      <SessionChips format={summary.format} style={summary.style} levels={summary.levels} size="sm" />
      {running && (
        <Button size="md" leftSection={<Play />} onClick={go} className={classes.action}>
          <Trans comment="Button on your running session card">Continue</Trans>
        </Button>
      )}
      {summary.status === SessionStatus.enum.open && (
        <Button size="md" variant="default" rightSection={<ArrowRight />} onClick={go} className={classes.action}>
          <Trans comment="Button on a session card that opens the session page">Go to session</Trans>
        </Button>
      )}
    </Paper>
  );
});

const PastMenu: FC<Required<CardProps>> = ({ summary, onAction }) => {
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

export const PastTable: FC<{ summaries: SessionSummary[]; onAction: Required<CardProps>['onAction'] }> = ({
  summaries,
  onAction,
}) => (
  <SessionTable
    head={
      <>
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
      </>
    }
  >
    {summaries.map((summary) => {
      const minutes = sessionMinutes(summary);
      return (
        <SessionRow key={summary.id} code={summary.shareCode}>
          <Table.Td>
            <div className={tables.stacked}>
              {sessionTimeText(summary) ?? formatStart(summary.createdAt)}
              {minutes !== null && minutes > 0 && (
                <Text size="xs" c="dimmed">
                  {durationText(minutes)}
                </Text>
              )}
            </div>
          </Table.Td>
          <Table.Td className={tables.main}>
            <Group gap={8} wrap="nowrap">
              <SessionLink code={summary.shareCode} title={summary.title} />
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
        </SessionRow>
      );
    })}
  </SessionTable>
);

export const SessionGrid: FC<{ summaries: SessionSummary[]; onAction?: CardProps['onAction'] }> = ({
  summaries,
  onAction,
}) => (
  <div className={classes.grid}>
    {summaries.map((summary) => (
      <SessionCard key={summary.id} summary={summary} onAction={onAction} />
    ))}
  </div>
);

export const SessionHistory: FC = () => {
  const { t } = useLingui();
  const userId = useSessionUserId();
  const wide = useMediaQuery(TABLE_QUERY);
  const [page, setPage] = useState(1);
  const history = useMySessionHistory(page);
  const { asked, ask, close } = useSessionActions();
  const past = history.data?.items ?? EMPTY_SUMMARIES;
  const pages = Math.ceil((history.data?.total ?? 0) / PAGE_SIZE);
  const title = <Trans>Past sessions</Trans>;

  if (!userId) return null;
  if (history.isPending) {
    return (
      <HomeSection title={title}>
        <div className={classes.grid} aria-busy>
          {HISTORY_SKELETONS.map((i) => (
            <Skeleton key={i} height={120} radius="lg" />
          ))}
        </div>
      </HomeSection>
    );
  }
  if (history.isError) {
    return (
      <HomeSection title={title}>
        <LoadError
          title={t`Couldn't load your sessions`}
          error={history.error}
          retrying={history.isRefetching}
          onRetry={() => void history.refetch()}
        />
      </HomeSection>
    );
  }
  if (past.length === 0) return null;
  return (
    <HomeSection title={title}>
      {wide ? <PastTable summaries={past} onAction={ask} /> : <SessionGrid summaries={past} onAction={ask} />}
      {pages > 1 && <Pagination total={pages} value={page} onChange={setPage} className={tables.pager} />}
      {asked && <ActionModal action={asked.action} summary={asked.summary} onClose={close} />}
    </HomeSection>
  );
};
