import { Trans, useLingui } from '@lingui/react/macro';
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import type { UseQueryResult } from '@tanstack/react-query';
import { memo, useMemo, type FC } from 'react';

import type { Shift } from '~/cms/calendar';
import { useTeams } from '~/cms/siteData';
import { useSessionUserId } from '~/components/auth/hooks';
import { ArrowCounterClockwise, ArrowUpRight, CheckCircle, HandHeart, Warning } from '~/components/ui';
import { Team } from '~/data/events';
import { useUi } from '~/stores/ui';
import { date, formatDate } from '~/utils/dates';
import { percent } from '~/utils/numbers';
import type { ShiftCounts, ShiftVolunteer } from '~/volunteers/model';
import {
  useMyShifts,
  useRemoveVolunteer,
  useShiftCounts,
  useTakeShift,
  volunteerErrorMessage,
} from '~/volunteers/queries';

import { shiftTime, TEAM_COLORS } from './shifts';
import { TeamBadge } from './TeamBadge';

import classes from './ShiftBoard.module.css';

const EMPTY_SHIFTS: Shift[] = [];
const NO_MINE: ShiftVolunteer[] = [];
const TAB_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
const ROW_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const HOW_ICON = <HandHeart width={22} height={22} />;
const WARN_ICON = <Warning />;
const RETRY_ICON = <ArrowCounterClockwise />;
const IN_ICON = <CheckCircle />;

type Taken = number | null | undefined;

const takenOf = (counts: UseQueryResult<ShiftCounts>, key: string): Taken => {
  if (counts.isSuccess) return counts.data.get(key) ?? 0;
  return counts.isError ? null : undefined;
};

const selectOpenLogin = (s: ReturnType<typeof useUi.getState>) => s.openLogin;

const ShiftTime: FC<{ shift: Shift }> = ({ shift }) => {
  const { t } = useLingui();
  return (
    <Text span className="tabular" fw={600}>
      {shiftTime(shift)}
      {shift.setup && (
        <Text span size="sm" c="dimmed" fw={400} ml={6}>
          {t`setup or teardown`}
        </Text>
      )}
    </Text>
  );
};

const Fill: FC<{ taken: Taken; spots: number }> = ({ taken, spots }) => {
  const { t } = useLingui();
  if (taken === undefined) return <Skeleton height={28} radius="sm" />;
  if (taken === null) {
    return (
      <Text size="sm" c="dimmed">
        –
      </Text>
    );
  }
  const full = taken >= spots;
  return (
    <Stack gap={4}>
      <Text size="sm" className="tabular" fw={full ? 600 : 400} c={full ? undefined : 'dimmed'}>
        <Trans comment="How many spots of a volunteer shift are taken, e.g. 2 of 3">
          {taken} of {spots}
        </Trans>
      </Text>
      <Progress
        size="sm"
        radius="xl"
        value={percent(taken, spots)}
        color={full ? 'teal' : undefined}
        aria-label={t`${taken} of ${spots} spots taken`}
      />
    </Stack>
  );
};

type ShiftItemProps = {
  shift: Shift;
  eventId: string;
  taken: Taken;
  mine: ShiftVolunteer | undefined;
  signedIn: boolean;
  mineLoading: boolean;
  readOnly: boolean;
};

const ShiftAction: FC<ShiftItemProps> = ({ shift, eventId, taken, mine, signedIn, mineLoading, readOnly }) => {
  const { i18n } = useLingui();
  const openLogin = useUi(selectOpenLogin);
  const take = useTakeShift();
  const remove = useRemoveVolunteer();
  const error = take.error ?? remove.error;

  const full = typeof taken === 'number' && taken >= shift.spots;
  const signUp = <Trans comment="Button that takes a volunteer shift">Sign up</Trans>;

  let action;
  if (readOnly) {
    action = mine ? (
      <Badge color="teal" variant="light" leftSection={IN_ICON}>
        <Trans>You helped</Trans>
      </Badge>
    ) : null;
  } else if (mineLoading) {
    action = <Skeleton height={30} width={90} radius="xl" />;
  } else if (mine) {
    action = (
      <Group gap={4} wrap="nowrap">
        <Badge color="teal" variant="filled" size="lg" leftSection={IN_ICON}>
          <Trans>You're in</Trans>
        </Badge>
        <Button
          size="compact-xs"
          variant="subtle"
          color="red"
          loading={remove.isPending}
          onClick={() => remove.mutate(mine.id)}
        >
          <Trans comment="Button that drops your own volunteer shift">Cancel</Trans>
        </Button>
      </Group>
    );
  } else if (full) {
    action = (
      <Badge color="gray" variant="light" size="lg">
        <Trans comment="Volunteer shift with no free spots">Full</Trans>
      </Badge>
    );
  } else if (!signedIn) {
    action = (
      <Button size="xs" variant="light" onClick={openLogin}>
        {signUp}
      </Button>
    );
  } else if (taken === undefined) {
    action = <Skeleton height={30} width={90} radius="xl" />;
  } else if (taken === null) {
    action = (
      <Button size="xs" disabled>
        {signUp}
      </Button>
    );
  } else {
    action = (
      <Button size="xs" loading={take.isPending} onClick={() => take.mutate({ eventId, shiftKey: shift._key })}>
        {signUp}
      </Button>
    );
  }

  return (
    <>
      <div className={classes.shift__action}>{action}</div>
      {error && (
        <Text size="xs" c="red" className={classes.shift__error} role="alert">
          {i18n._(volunteerErrorMessage(error))}
        </Text>
      )}
    </>
  );
};

const ShiftItem = memo<ShiftItemProps>((props) => (
  <Paper withBorder radius="md" p="sm" className={classes.shift} data-mine={Boolean(props.mine) || undefined}>
    <Group gap="sm" wrap="wrap" className={classes.shift__info}>
      <TeamBadge team={props.shift.team} />
      <ShiftTime shift={props.shift} />
    </Group>
    <div className={classes.shift__fill}>
      <Fill taken={props.taken} spots={props.shift.spots} />
    </div>
    <ShiftAction {...props} />
  </Paper>
));

const MyShiftRow: FC<{ shift: Shift; entry: ShiftVolunteer; readOnly: boolean }> = ({ shift, entry, readOnly }) => {
  const { i18n } = useLingui();
  const remove = useRemoveVolunteer();
  return (
    <Stack gap={2}>
      <Group gap="sm" wrap="wrap" justify="space-between">
        <Group gap="sm" wrap="wrap">
          <TeamBadge team={shift.team} />
          <Text size="sm" fw={600} className="tabular capitalize-first">
            {formatDate(date(shift.day), ROW_DATE)}, {shiftTime(shift)}
          </Text>
        </Group>
        {!readOnly && (
          <Button
            size="compact-xs"
            variant="subtle"
            color="red"
            loading={remove.isPending}
            onClick={() => remove.mutate(entry.id)}
          >
            <Trans comment="Button that drops your own volunteer shift">Cancel</Trans>
          </Button>
        )}
      </Group>
      {remove.error && (
        <Text size="xs" c="red" role="alert">
          {i18n._(volunteerErrorMessage(remove.error))}
        </Text>
      )}
    </Stack>
  );
};

const MyShifts: FC<{ shifts: readonly Shift[]; mine: readonly ShiftVolunteer[]; readOnly: boolean }> = ({
  shifts,
  mine,
  readOnly,
}) => {
  const rows = useMemo(() => {
    const byKey = new Map(shifts.map((s) => [s._key, s]));
    return mine.flatMap((entry) => {
      const shift = byKey.get(entry.shiftKey);
      return shift ? [{ shift, entry }] : [];
    });
  }, [shifts, mine]);
  if (rows.length === 0) return null;
  return (
    <Paper withBorder radius="lg" p="md" className={classes.mine}>
      <Stack gap="sm">
        <Group gap="xs">
          <CheckCircle className={classes.mine__icon} width={22} height={22} />
          <Text fw={700}>{readOnly ? <Trans>You helped out</Trans> : <Trans>You're on</Trans>}</Text>
        </Group>
        {rows.map(({ shift, entry }) => (
          <MyShiftRow key={entry.id} shift={shift} entry={entry} readOnly={readOnly} />
        ))}
      </Stack>
    </Paper>
  );
};

const HowToJoin: FC<{ signedIn: boolean; signupUrl?: string }> = ({ signedIn, signupUrl }) => (
  <Alert variant="light" radius="lg" icon={HOW_ICON} title={<Trans>Want a shift?</Trans>}>
    <Stack gap="sm" align="flex-start">
      <Text size="sm">
        {signedIn ? (
          <Trans>Pick a free shift below and tap Sign up.</Trans>
        ) : (
          <Trans>Pick a free shift below. Log in first, it takes a minute.</Trans>
        )}
      </Text>
      {signupUrl && (
        <Button
          size="xs"
          variant="default"
          component="a"
          href={signupUrl}
          target="_blank"
          rel="noreferrer"
          rightSection={<ArrowUpRight />}
        >
          <Trans>Open the sign-up sheet</Trans>
        </Button>
      )}
    </Stack>
  </Alert>
);

export type ShiftBoardProps = {
  eventId: string;
  signupUrl?: string;
  days: string[];
  shifts: readonly Shift[];
  day: string;
  onDayChange: (day: string) => void;
  readOnly?: boolean;
};

export const ShiftBoard: FC<ShiftBoardProps> = ({
  eventId,
  signupUrl,
  days,
  shifts,
  day,
  onDayChange,
  readOnly = false,
}) => {
  const teams = useTeams();
  const signedIn = Boolean(useSessionUserId());
  const counts = useShiftCounts(eventId);
  const mine = useMyShifts(eventId);
  const myShifts = mine.data ?? NO_MINE;
  const byDay = useMemo(() => Map.groupBy(shifts, (s) => s.day), [shifts]);
  const mineByKey = useMemo(() => new Map(myShifts.map((v) => [v.shiftKey, v])), [myShifts]);

  return (
    <Stack gap="md">
      {signedIn && <MyShifts shifts={shifts} mine={myShifts} readOnly={readOnly} />}
      {!readOnly && <HowToJoin signedIn={signedIn} signupUrl={signupUrl} />}
      {counts.isError && (
        <Alert variant="light" color="red" radius="lg" icon={WARN_ICON} title={<Trans>Couldn't load the spots</Trans>}>
          <Button size="xs" variant="light" color="red" leftSection={RETRY_ICON} onClick={() => counts.refetch()}>
            <Trans>Try again</Trans>
          </Button>
        </Alert>
      )}
      {signedIn && mine.isError && (
        <Alert
          variant="light"
          color="red"
          radius="lg"
          icon={WARN_ICON}
          title={<Trans>Couldn't load your shifts</Trans>}
        >
          <Button size="xs" variant="light" color="red" leftSection={RETRY_ICON} onClick={() => mine.refetch()}>
            <Trans>Try again</Trans>
          </Button>
        </Alert>
      )}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {Team.options.map((team) => (
          <Card key={team} withBorder radius="md" padding="md">
            <Badge color={TEAM_COLORS[team]} variant="light" mb={6}>
              {teams[team].name}
            </Badge>
            <Text size="sm" c="dimmed">
              {teams[team].what}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
      <Tabs value={day} onChange={(value) => value && onDayChange(value)} variant="pills" radius="xl">
        <Tabs.List mb="md">
          {days.map((d) => (
            <Tabs.Tab key={d} value={d} className="capitalize-first">
              {formatDate(date(d), TAB_DATE)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {days.map((d) => (
          <Tabs.Panel key={d} value={d}>
            <Stack gap="sm">
              {(byDay.get(d) ?? EMPTY_SHIFTS).map((shift) => (
                <ShiftItem
                  key={shift._key}
                  shift={shift}
                  eventId={eventId}
                  taken={takenOf(counts, shift._key)}
                  mine={mineByKey.get(shift._key)}
                  signedIn={signedIn}
                  mineLoading={mine.isPending && signedIn}
                  readOnly={readOnly}
                />
              ))}
            </Stack>
          </Tabs.Panel>
        ))}
      </Tabs>
    </Stack>
  );
};
