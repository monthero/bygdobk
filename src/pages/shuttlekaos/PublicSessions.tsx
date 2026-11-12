import { Trans, useLingui } from '@lingui/react/macro';
import {
  Badge,
  Button,
  Chip,
  Drawer,
  Group,
  Paper,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, useNavigate } from '@tanstack/react-router';
import { memo, useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import { useSessionUserId } from '~/components/auth/hooks';
import { Eye, SlidersHorizontal, UserPlus } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { notifyFailed } from '~/pages/board/format';
import { LoadError } from '~/pages/board/LoadError';
import { Format, Level, PlayStyle, SessionStatus, type PublicSession } from '~/shuttlekaos/model';
import { shuttleKaosErrorMessage, useJoinSession, usePublicSessions } from '~/shuttlekaos/queries';
import { useUi } from '~/stores/ui';

import { BRAND, FORMAT_LABELS, STYLE_LABELS } from './labels';
import { LevelsText } from './Levels';

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
const CHIP_CLASS_NAMES = { label: classes.chip };

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

const FilterFields: FC<{
  filters: Filters;
  organizers: { value: string; label: string }[];
  onChange: (f: Filters) => void;
}> = ({ filters, organizers, onChange }) => {
  const { t, i18n } = useLingui();
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  return (
    <Stack gap="sm">
      <Chip.Group multiple value={filters.levels} onChange={(v) => set({ levels: z.array(Level).catch([]).parse(v) })}>
        <Group gap={6} aria-label={t`Level`}>
          {Level.options.map((level) => (
            <Chip key={level} value={level} radius="xl" classNames={CHIP_CLASS_NAMES}>
              {level}
            </Chip>
          ))}
        </Group>
      </Chip.Group>
      <SegmentedControl
        fullWidth
        radius="xl"
        value={filters.live}
        onChange={(v) => set({ live: Live.parse(v) })}
        data={[
          { value: Live.enum.all, label: t`All` },
          { value: Live.enum.open, label: t`Open to join` },
          { value: Live.enum.running, label: t`Live now` },
        ]}
      />
      <SegmentedControl
        fullWidth
        radius="xl"
        value={filters.style}
        onChange={(v) => set({ style: StyleFilter.parse(v) })}
        data={[
          { value: StyleFilter.enum.all, label: t`Any play` },
          ...PlayStyle.options.map((value) => ({ value, label: i18n._(STYLE_LABELS[value]) })),
        ]}
      />
      <SegmentedControl
        fullWidth
        radius="xl"
        value={filters.format}
        onChange={(v) => set({ format: FormatFilter.parse(v) })}
        data={[
          { value: FormatFilter.enum.all, label: t`Any format` },
          ...Format.options.map((value) => ({ value, label: i18n._(FORMAT_LABELS[value].label) })),
        ]}
      />
      <Select
        clearable
        placeholder={t`Any organizer`}
        aria-label={t`Organizer`}
        data={organizers}
        value={filters.organizer}
        onChange={(organizer) => set({ organizer })}
      />
    </Stack>
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
    <Paper withBorder radius="lg" className={classes.card}>
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
          <Badge variant="default" tt="none">
            <LevelsText levels={session.levels} />
          </Badge>
          <Badge variant="default" tt="none">
            {format}
          </Badge>
          <Badge variant="default" tt="none">
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
  const mobile = useIsMobile();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [drawer, drawerControls] = useDisclosure(false);
  const list = usePublicSessions(filters.levels);
  const all = list.data ?? EMPTY;
  const organizers = useMemo(
    () => Array.from(new Map(all.map((s) => [s.organizerId, s.organizerName])), ([value, label]) => ({ value, label })),
    [all],
  );
  const shown = all.filter((s) => matches(s, filters));
  const count = activeCount(filters);
  const shownCount = shown.length;

  const fields = <FilterFields filters={filters} organizers={organizers} onChange={setFilters} />;
  const clear = count > 0 && (
    <Button variant="subtle" size="compact-md" h={44} onClick={() => setFilters(NO_FILTERS)}>
      <Trans>Clear</Trans>
    </Button>
  );

  let body;
  if (list.isPending) {
    body = (
      <Stack gap="sm" aria-busy>
        {SKELETONS.map((i) => (
          <Skeleton key={i} height={120} radius="lg" />
        ))}
      </Stack>
    );
  } else if (list.isError) {
    body = (
      <LoadError
        title={t`Couldn't load open sessions`}
        error={list.error}
        retrying={list.isRefetching}
        onRetry={() => void list.refetch()}
      />
    );
  } else if (shown.length === 0) {
    body = (
      <Text c="dimmed">
        {count > 0 ? (
          <Trans>Nothing matches these filters.</Trans>
        ) : (
          <Trans>No open sessions right now. Start one and get the chaos going!</Trans>
        )}
      </Text>
    );
  } else {
    body = (
      <div className={classes.grid}>
        {shown.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    );
  }

  return (
    <Stack gap="sm">
      {mobile ? (
        <Group gap="xs">
          <Button
            variant="default"
            h={44}
            leftSection={<SlidersHorizontal />}
            rightSection={
              count > 0 && (
                <Badge size="sm" circle>
                  {count}
                </Badge>
              )
            }
            onClick={drawerControls.open}
          >
            <Trans>Filters</Trans>
          </Button>
          {clear}
        </Group>
      ) : (
        <Paper withBorder radius="lg" p="sm" className={classes.filters}>
          {fields}
          {clear}
        </Paper>
      )}
      {body}
      <Drawer
        opened={drawer}
        onClose={drawerControls.close}
        position="bottom"
        radius="lg"
        size="auto"
        title={<Trans>Filters</Trans>}
      >
        <Stack gap="md" pb="calc(16px + env(safe-area-inset-bottom))">
          {fields}
          <Group grow>
            <Button variant="default" disabled={count === 0} onClick={() => setFilters(NO_FILTERS)}>
              <Trans>Clear</Trans>
            </Button>
            <Button onClick={drawerControls.close}>
              <Trans comment="Button that closes the filters, e.g. Show 4">Show {shownCount}</Trans>
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </Stack>
  );
};
