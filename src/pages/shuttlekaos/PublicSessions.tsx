import { Trans, useLingui } from '@lingui/react/macro';
import {
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
  VisuallyHidden,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Link, useNavigate } from '@tanstack/react-router';
import { memo, useMemo, useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import { useSessionUserId } from '~/components/auth/hooks';
import { CaretDown, Check, Eye, MapPin, UserPlus, X } from '~/components/ui';
import { notifyFailed } from '~/pages/board/format';
import { LoadError } from '~/pages/board/LoadError';
import { Format, Level, PlayStyle, SessionStatus, type PublicSession } from '~/shuttlekaos/model';
import { PAGE_SIZE, shuttleKaosErrorMessage, useJoinSession, usePublicSessions } from '~/shuttlekaos/queries';
import { useUi } from '~/stores/ui';

import { LiveBadge } from './Fallbacks';
import { BRAND, FORMAT_LABELS, formatStart, stop, STYLE_LABELS, TABLE_QUERY } from './labels';
import { LevelsText } from './Levels';
import { NewSessionButton } from './NewSessionButton';
import { FormatCell } from './SettingsSummary';

import classes from './PublicSessions.module.css';
import tables from './SessionTables.module.css';

const ALL = 'all';
const Live = z.enum([ALL, 'open', 'running']);
type Live = z.infer<typeof Live>;
const StyleFilter = z.enum([ALL, ...PlayStyle.options]);
type StyleFilter = z.infer<typeof StyleFilter>;
const FormatFilter = z.enum([ALL, ...Format.options]);
type FormatFilter = z.infer<typeof FormatFilter>;

type Filters = {
  levels: Level[];
  style: StyleFilter;
  format: FormatFilter;
  organizer: string | null;
  location: string | null;
  live: Live;
};
type Option = { value: string; label: string };

const NO_FILTERS: Filters = {
  levels: [],
  style: StyleFilter.enum.all,
  format: FormatFilter.enum.all,
  organizer: null,
  location: null,
  live: Live.enum.all,
};
const EMPTY: PublicSession[] = [];
const SKELETONS = [0, 1];

const selectOpenLogin = (s: ReturnType<typeof useUi.getState>) => s.openLogin;

const activeCount = (f: Filters) =>
  [
    f.levels.length > 0,
    f.style !== StyleFilter.enum.all,
    f.format !== FormatFilter.enum.all,
    f.organizer !== null,
    f.location !== null,
    f.live !== Live.enum.all,
  ].filter(Boolean).length;

const matches = (s: PublicSession, f: Filters) =>
  (f.style === StyleFilter.enum.all || s.style === f.style) &&
  (f.format === FormatFilter.enum.all || s.format === f.format) &&
  (f.organizer === null || s.organizerId === f.organizer) &&
  (f.location === null || s.location?.locationId === f.location) &&
  (f.live === Live.enum.all || s.status === f.live);

const FilterPill: FC<{
  name: string;
  value: ReactNode;
  multiple?: boolean;
  onClear: () => void;
  children: ReactNode;
}> = ({ name, value, multiple, onClear, children }) => {
  const { t } = useLingui();
  const active = value !== null;
  return (
    <Button.Group className={classes.pill}>
      <Menu closeOnItemClick={!multiple} position="bottom-start" shadow="md" width={220}>
        <Menu.Target>
          <Button
            h={44}
            radius="xl"
            variant={active ? 'light' : 'default'}
            color={active ? 'brand' : undefined}
            rightSection={<CaretDown />}
          >
            {value ?? name}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>{children}</Menu.Dropdown>
      </Menu>
      {active && (
        <Button
          h={44}
          radius="xl"
          variant="light"
          color="brand"
          px={12}
          aria-label={t`Clear ${name}`}
          onClick={onClear}
        >
          <X />
        </Button>
      )}
    </Button.Group>
  );
};

const CheckItem: FC<{ checked: boolean; onClick: () => void; children: ReactNode }> = ({
  checked,
  onClick,
  children,
}) => (
  <Menu.Item
    role="menuitemcheckbox"
    aria-checked={checked}
    leftSection={checked ? <Check /> : <span className={classes.noCheck} />}
    color={checked ? 'brand' : undefined}
    onClick={onClick}
  >
    {children}
  </Menu.Item>
);

const FilterRow: FC<{
  filters: Filters;
  organizers: Option[];
  locations: Option[];
  onChange: (f: Filters) => void;
}> = ({ filters, organizers, locations, onChange }) => {
  const { t, i18n } = useLingui();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const toggleLevel = (level: Level) =>
    set({
      levels: filters.levels.includes(level) ? filters.levels.filter((l) => l !== level) : [...filters.levels, level],
    });
  const organizer = organizers.find((o) => o.value === filters.organizer)?.label ?? null;
  const location = locations.find((o) => o.value === filters.location)?.label ?? null;

  let live: string | null = null;
  if (filters.live === Live.enum.open) live = t`Open to join`;
  else if (filters.live === Live.enum.running) live = t`Live now`;

  return (
    <div className={classes.row}>
      <FilterPill
        name={t`Level`}
        multiple
        value={filters.levels.length > 0 ? <LevelsText levels={filters.levels} /> : null}
        onClear={() => set({ levels: [] })}
      >
        {Level.options.map((level) => (
          <CheckItem key={level} checked={filters.levels.includes(level)} onClick={() => toggleLevel(level)}>
            {level}
          </CheckItem>
        ))}
      </FilterPill>
      <FilterPill name={t`Status`} value={live} onClear={() => set({ live: Live.enum.all })}>
        <CheckItem checked={filters.live === Live.enum.open} onClick={() => set({ live: Live.enum.open })}>
          <Trans>Open to join</Trans>
        </CheckItem>
        <CheckItem checked={filters.live === Live.enum.running} onClick={() => set({ live: Live.enum.running })}>
          <Trans>Live now</Trans>
        </CheckItem>
      </FilterPill>
      <FilterPill
        name={t({ message: 'Play', context: 'ShuttleKaos setup: singles or doubles' })}
        value={filters.style === StyleFilter.enum.all ? null : i18n._(STYLE_LABELS[filters.style])}
        onClear={() => set({ style: StyleFilter.enum.all })}
      >
        {PlayStyle.options.map((style) => (
          <CheckItem key={style} checked={filters.style === style} onClick={() => set({ style })}>
            {i18n._(STYLE_LABELS[style])}
          </CheckItem>
        ))}
      </FilterPill>
      <FilterPill
        name={t`Format`}
        value={filters.format === FormatFilter.enum.all ? null : i18n._(FORMAT_LABELS[filters.format].label)}
        onClear={() => set({ format: FormatFilter.enum.all })}
      >
        {Format.options.map((format) => (
          <CheckItem key={format} checked={filters.format === format} onClick={() => set({ format })}>
            {i18n._(FORMAT_LABELS[format].label)}
          </CheckItem>
        ))}
      </FilterPill>
      <FilterPill name={t`Organizer`} value={organizer} onClear={() => set({ organizer: null })}>
        {organizers.map((o) => (
          <CheckItem key={o.value} checked={filters.organizer === o.value} onClick={() => set({ organizer: o.value })}>
            {o.label}
          </CheckItem>
        ))}
      </FilterPill>
      {locations.length > 0 && (
        <FilterPill name={t`Location`} value={location} onClear={() => set({ location: null })}>
          {locations.map((o) => (
            <CheckItem key={o.value} checked={filters.location === o.value} onClick={() => set({ location: o.value })}>
              {o.label}
            </CheckItem>
          ))}
        </FilterPill>
      )}
      {activeCount(filters) > 0 && (
        <Button variant="subtle" color="brand" h={44} radius="xl" onClick={() => onChange(NO_FILTERS)}>
          <Trans>Clear all</Trans>
        </Button>
      )}
    </div>
  );
};

const SessionAction: FC<{ session: PublicSession; compact?: boolean }> = ({ session, compact }) => {
  const { i18n } = useLingui();
  const navigate = useNavigate();
  const userId = useSessionUserId();
  const openLogin = useUi(selectOpenLogin);
  const join = useJoinSession();
  const go = () => void navigate({ to: '/shuttlekaos/$code', params: { code: session.shareCode } });
  const size = compact ? 'sm' : 'md';

  const joinNow = () => {
    if (!userId) {
      openLogin();
      return;
    }
    join.mutate(session.shareCode, {
      onSuccess: go,
      onError: (error) => notifyFailed(i18n._(shuttleKaosErrorMessage(error))),
    });
  };

  if (session.status === SessionStatus.enum.open) {
    return (
      <Button
        size={size}
        leftSection={<UserPlus />}
        loading={join.isPending}
        onClick={joinNow}
        className={compact ? undefined : classes.action}
      >
        <Trans>Join</Trans>
      </Button>
    );
  }
  return (
    <Button
      size={size}
      variant="default"
      leftSection={<Eye />}
      onClick={go}
      className={compact ? undefined : classes.action}
    >
      <Trans>Watch</Trans>
    </Button>
  );
};

const StatusTag: FC<{ status: SessionStatus }> = ({ status }) =>
  status === SessionStatus.enum.open ? (
    <Badge color="teal" variant="light">
      <Trans comment="Session status: people can still join">Open to join</Trans>
    </Badge>
  ) : (
    <LiveBadge>
      <Trans comment="Session status: being played right now">Live now</Trans>
    </LiveBadge>
  );

const SessionCard = memo<{ session: PublicSession }>(({ session }) => {
  const { i18n } = useLingui();
  const players = session.playerCount;
  const organizer = session.organizerName;
  const format = i18n._(FORMAT_LABELS[session.format].label);
  const style = i18n._(STYLE_LABELS[session.style]);

  return (
    <Paper
      withBorder
      radius="lg"
      className={classes.card}
      data-live={session.status !== SessionStatus.enum.open || undefined}
    >
      <Link to="/shuttlekaos/$code" params={{ code: session.shareCode }} className={classes.cardLink}>
        <Group gap={6}>
          <StatusTag status={session.status} />
          <Badge variant="light" color="blue" tt="none">
            <LevelsText levels={session.levels} />
          </Badge>
          <Badge variant="light" color="blue" tt="none">
            {format}
          </Badge>
          <Badge variant="light" color="blue" tt="none">
            {style}
          </Badge>
        </Group>
        <Text fw={700} size="lg" className={classes.title}>
          {session.title || BRAND}
        </Text>
        <Text size="sm" c="dimmed">
          <Trans>
            By {organizer} · {players} players
          </Trans>
        </Text>
        {session.location && (
          <Text size="sm" className={classes.where}>
            <MapPin aria-hidden />
            {session.location.name}
          </Text>
        )}
      </Link>
      <SessionAction session={session} />
    </Paper>
  );
});

const OpenTable: FC<{ sessions: PublicSession[] }> = ({ sessions }) => {
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
            <Table.Th className={tables.num}>
              <Trans comment="Table heading">Players</Trans>
            </Table.Th>
            <Table.Th>
              <Trans comment="Table heading">Organizer</Trans>
            </Table.Th>
            <Table.Th className={tables.num}>
              <VisuallyHidden>
                <Trans comment="Table heading for the Join or Watch buttons">Action</Trans>
              </VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sessions.map((session) => (
            <Table.Tr
              key={session.id}
              className={tables.row}
              onClick={() => void navigate({ to: '/shuttlekaos/$code', params: { code: session.shareCode } })}
            >
              <Table.Td>
                {session.startedAt ? (
                  formatStart(session.startedAt)
                ) : (
                  <Text span size="sm" c="dimmed">
                    <Trans comment="Start column for a session that hasn't started yet">Not started</Trans>
                  </Text>
                )}
              </Table.Td>
              <Table.Td className={tables.main}>
                <Group gap={8} wrap="nowrap">
                  <StatusTag status={session.status} />
                  <Link
                    to="/shuttlekaos/$code"
                    params={{ code: session.shareCode }}
                    className={tables.title}
                    onClick={stop}
                  >
                    {session.title || BRAND}
                  </Link>
                </Group>
              </Table.Td>
              <Table.Td>{session.location?.name ?? '–'}</Table.Td>
              <Table.Td>
                <FormatCell format={session.format} style={session.style} levels={session.levels} />
              </Table.Td>
              <Table.Td className={tables.num}>{session.playerCount}</Table.Td>
              <Table.Td>{session.organizerName}</Table.Td>
              <Table.Td className={tables.num} onClick={stop}>
                <SessionAction session={session} compact />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Paper>
  );
};

export const PublicSessions: FC = () => {
  const { t } = useLingui();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [page, setPage] = useState(1);
  const wide = useMediaQuery(TABLE_QUERY);
  const list = usePublicSessions(filters.levels);
  const all = list.data ?? EMPTY;
  const organizers = useMemo(
    () => Array.from(new Map(all.map((s) => [s.organizerId, s.organizerName])), ([value, label]) => ({ value, label })),
    [all],
  );
  const locations = useMemo(
    () =>
      Array.from(
        new Map(all.flatMap((s) => (s.location ? [[s.location.locationId, s.location.name] as const] : []))),
        ([value, label]) => ({ value, label }),
      ).sort((a, b) => a.label.localeCompare(b.label, 'nb')),
    [all],
  );
  const shown = all.filter((s) => matches(s, filters));
  const filtering = activeCount(filters) > 0;
  const pages = Math.ceil(shown.length / PAGE_SIZE);
  const current = Math.min(page, Math.max(pages, 1));
  const visible = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const filter = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  if (list.isPending) {
    return (
      <Stack gap="sm" aria-busy>
        {SKELETONS.map((i) => (
          <Skeleton key={i} height={120} radius="lg" />
        ))}
      </Stack>
    );
  }
  if (list.isError) {
    return (
      <LoadError
        title={t`Couldn't load open sessions`}
        error={list.error}
        retrying={list.isRefetching}
        onRetry={() => void list.refetch()}
      />
    );
  }
  if (all.length === 0 && !filtering) {
    return (
      <Paper withBorder radius="lg" p="lg" className={classes.empty}>
        <Text>
          <Trans>No open sessions right now. Start one and get the chaos going!</Trans>
        </Text>
        <NewSessionButton size="sm" />
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      <FilterRow filters={filters} organizers={organizers} locations={locations} onChange={filter} />
      {shown.length === 0 && (
        <Text c="dimmed">
          <Trans>Nothing matches these filters.</Trans>
        </Text>
      )}
      {shown.length > 0 && wide && <OpenTable sessions={visible} />}
      {shown.length > 0 && !wide && (
        <div className={classes.grid}>
          {visible.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
      {pages > 1 && <Pagination total={pages} value={current} onChange={setPage} className={tables.pager} />}
    </Stack>
  );
};
