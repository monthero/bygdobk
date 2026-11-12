import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Group, Menu, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { Link, useNavigate } from '@tanstack/react-router';
import { memo, useMemo, useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import { useSessionUserId } from '~/components/auth/hooks';
import { CaretDown, Check, Eye, UserPlus, X } from '~/components/ui';
import { notifyFailed } from '~/pages/board/format';
import { LoadError } from '~/pages/board/LoadError';
import { Format, Level, PlayStyle, SessionStatus, type PublicSession } from '~/shuttlekaos/model';
import { shuttleKaosErrorMessage, useJoinSession, usePublicSessions } from '~/shuttlekaos/queries';
import { useUi } from '~/stores/ui';

import { BRAND, FORMAT_LABELS, STYLE_LABELS } from './labels';
import { LevelsText } from './Levels';
import { NewSessionButton } from './NewSessionButton';

import classes from './PublicSessions.module.css';

const ALL = 'all';
const Live = z.enum([ALL, 'open', 'running']);
type Live = z.infer<typeof Live>;
const StyleFilter = z.enum([ALL, ...PlayStyle.options]);
type StyleFilter = z.infer<typeof StyleFilter>;
const FormatFilter = z.enum([ALL, ...Format.options]);
type FormatFilter = z.infer<typeof FormatFilter>;

type Filters = { levels: Level[]; style: StyleFilter; format: FormatFilter; organizer: string | null; live: Live };

const NO_FILTERS: Filters = {
  levels: [],
  style: StyleFilter.enum.all,
  format: FormatFilter.enum.all,
  organizer: null,
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
    f.live !== Live.enum.all,
  ].filter(Boolean).length;

const matches = (s: PublicSession, f: Filters) =>
  (f.style === StyleFilter.enum.all || s.style === f.style) &&
  (f.format === FormatFilter.enum.all || s.format === f.format) &&
  (f.organizer === null || s.organizerId === f.organizer) &&
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
  organizers: { value: string; label: string }[];
  onChange: (f: Filters) => void;
}> = ({ filters, organizers, onChange }) => {
  const { t, i18n } = useLingui();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const toggleLevel = (level: Level) =>
    set({
      levels: filters.levels.includes(level) ? filters.levels.filter((l) => l !== level) : [...filters.levels, level],
    });
  const organizer = organizers.find((o) => o.value === filters.organizer)?.label ?? null;

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
      {activeCount(filters) > 0 && (
        <Button variant="subtle" color="brand" h={44} radius="xl" onClick={() => onChange(NO_FILTERS)}>
          <Trans>Clear all</Trans>
        </Button>
      )}
    </div>
  );
};

const SessionCard = memo<{ session: PublicSession }>(({ session }) => {
  const { i18n } = useLingui();
  const navigate = useNavigate();
  const userId = useSessionUserId();
  const openLogin = useUi(selectOpenLogin);
  const join = useJoinSession();
  const open = session.status === SessionStatus.enum.open;
  const players = session.playerCount;
  const organizer = session.organizerName;
  const format = i18n._(FORMAT_LABELS[session.format].label);
  const style = i18n._(STYLE_LABELS[session.style]);
  const go = () => void navigate({ to: '/shuttlekaos/$code', params: { code: session.shareCode } });

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

  return (
    <Paper withBorder radius="lg" className={classes.card} data-live={!open || undefined}>
      <Link to="/shuttlekaos/$code" params={{ code: session.shareCode }} className={classes.cardLink}>
        <Group gap={6}>
          {open ? (
            <Badge color="teal" variant="light">
              <Trans comment="Session status: people can still join">Open to join</Trans>
            </Badge>
          ) : (
            <Badge color="red" variant="light">
              <Trans comment="Session status: being played right now">Live now</Trans>
            </Badge>
          )}
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
      </Link>
      {open ? (
        <Button
          size="md"
          leftSection={<UserPlus />}
          loading={join.isPending}
          onClick={joinNow}
          className={classes.action}
        >
          <Trans>Join</Trans>
        </Button>
      ) : (
        <Button size="md" variant="default" leftSection={<Eye />} onClick={go} className={classes.action}>
          <Trans>Watch</Trans>
        </Button>
      )}
    </Paper>
  );
});

export const PublicSessions: FC = () => {
  const { t } = useLingui();
  const [filters, setFilters] = useState(NO_FILTERS);
  const list = usePublicSessions(filters.levels);
  const all = list.data ?? EMPTY;
  const organizers = useMemo(
    () => Array.from(new Map(all.map((s) => [s.organizerId, s.organizerName])), ([value, label]) => ({ value, label })),
    [all],
  );
  const shown = all.filter((s) => matches(s, filters));
  const filtering = activeCount(filters) > 0;

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
      <FilterRow filters={filters} organizers={organizers} onChange={setFilters} />
      {shown.length === 0 ? (
        <Text c="dimmed">
          <Trans>Nothing matches these filters.</Trans>
        </Text>
      ) : (
        <div className={classes.grid}>
          {shown.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </Stack>
  );
};
