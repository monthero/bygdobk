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
  Stack,
  Table,
  Tabs,
  Text,
} from '@mantine/core';
import { memo, useCallback, useMemo, useState, type FC } from 'react';

import { useUser } from '~/components/auth';
import { Check, HandHeart } from '~/components/ui';
import { Team, TEAMS, type Shift } from '~/data/events';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useUi } from '~/stores/ui';
import { date, formatDate } from '~/utils/dates';

import { takenSpots, TEAM_COLORS } from './shifts';

import classes from './ShiftBoard.module.css';

const NO_SHIFTS: ReadonlySet<string> = new Set();
const EMPTY_SHIFTS: Shift[] = [];
const TAB_DATE: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
const MINE_DATE: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const MINE_ICON = <HandHeart width={22} height={22} />;

const shiftTime = (shift: Shift) => (shift.end ? `${shift.start}–${shift.end}` : shift.start);

type ShiftRowProps = {
  shift: Shift;
  mine: boolean;
  readOnly: boolean;
  userName?: string;
  onToggle: (id: string) => void;
};

const TeamBadge: FC<{ team: Team }> = ({ team }) => {
  const { i18n } = useLingui();
  return (
    <Badge color={TEAM_COLORS[team]} variant="light">
      {i18n._(TEAMS[team].name)}
    </Badge>
  );
};

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

const ShiftFill: FC<{ taken: number; spots: number }> = ({ taken, spots }) => (
  <Stack gap={4}>
    <Text size="sm" className="tabular">
      <Trans>
        {taken} of {spots}
      </Trans>
    </Text>
    <Progress value={(taken / spots) * 100} color={taken >= spots ? 'teal' : 'brand'} size="sm" />
  </Stack>
);

const ShiftButton: FC<{
  id: string;
  mine: boolean;
  full: boolean;
  fullWidth?: boolean;
  onToggle: (id: string) => void;
}> = ({ id, mine, full, fullWidth = false, onToggle }) => {
  const { t } = useLingui();
  return (
    <Button
      size={fullWidth ? 'sm' : 'xs'}
      fullWidth={fullWidth}
      variant={mine ? 'light' : 'filled'}
      color={mine ? 'teal' : undefined}
      leftSection={mine ? <Check /> : undefined}
      disabled={full && !mine}
      onClick={() => onToggle(id)}
    >
      {mine && t`You’re in`}
      {!mine && full && t`Full`}
      {!mine && !full && t`Sign up`}
    </Button>
  );
};

const ShiftRow = memo<ShiftRowProps>(({ shift, mine, readOnly, userName, onToggle }) => {
  const taken = takenSpots(shift) + (mine ? 1 : 0);
  return (
    <Table.Tr>
      <Table.Td>
        <TeamBadge team={shift.team} />
      </Table.Td>
      <Table.Td>
        <ShiftTime shift={shift} />
      </Table.Td>
      <Table.Td miw={140}>
        <ShiftFill taken={taken} spots={shift.spots} />
      </Table.Td>
      {!readOnly && (
        <Table.Td>
          <Group gap="sm" justify="flex-end" wrap="nowrap">
            {mine && userName && (
              <Text size="sm" c="dimmed" truncate>
                {userName}
              </Text>
            )}
            <ShiftButton id={shift.id} mine={mine} full={taken >= shift.spots} onToggle={onToggle} />
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  );
});

const ShiftCard = memo<ShiftRowProps>(({ shift, mine, readOnly, onToggle }) => {
  const taken = takenSpots(shift) + (mine ? 1 : 0);
  return (
    <Paper withBorder radius="md" p="md" className={classes.card} data-mine={mine || undefined}>
      <Stack gap="sm">
        <Group gap="sm" wrap="wrap">
          <TeamBadge team={shift.team} />
          <ShiftTime shift={shift} />
        </Group>
        <ShiftFill taken={taken} spots={shift.spots} />
        {!readOnly && (
          <ShiftButton id={shift.id} mine={mine} full={taken >= shift.spots} fullWidth onToggle={onToggle} />
        )}
      </Stack>
    </Paper>
  );
});

const MyShifts: FC<{ shifts: Shift[]; onCancel: (id: string) => void }> = ({ shifts, onCancel }) => {
  const { i18n, t } = useLingui();
  return (
    <Alert variant="light" color="teal" radius="lg" icon={MINE_ICON} title={<Trans>You’re on</Trans>}>
      <Stack gap={6}>
        {shifts.map((shift) => {
          const label = `${i18n._(TEAMS[shift.team].name)}, ${formatDate(date(shift.day), MINE_DATE)} ${shiftTime(shift)}`;
          return (
            <Group key={shift.id} gap="sm" justify="space-between" wrap="nowrap">
              <Text size="sm" fw={600} className="tabular">
                {label}
              </Text>
              <Button
                size="compact-sm"
                variant="subtle"
                color="red"
                aria-label={t`Cancel shift: ${label}`}
                onClick={() => onCancel(shift.id)}
              >
                <Trans context="Leave a volunteer shift">Cancel</Trans>
              </Button>
            </Group>
          );
        })}
      </Stack>
    </Alert>
  );
};

export type ShiftBoardProps = {
  days: string[];
  shifts: Shift[];
  day: string;
  onDayChange: (day: string) => void;
  readOnly?: boolean;
};

export const ShiftBoard: FC<ShiftBoardProps> = ({ days, shifts, day, onDayChange, readOnly = false }) => {
  const { i18n } = useLingui();
  const user = useUser();
  const isMobile = useIsMobile();
  const openLogin = useUi((s) => s.openLogin);
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const mine = user ? picked : NO_SHIFTS;
  const signedIn = user !== null;
  const byDay = useMemo(() => Map.groupBy(shifts, (s) => s.day), [shifts]);
  const myShifts = useMemo(() => shifts.filter((s) => mine.has(s.id)), [shifts, mine]);

  const toggle = useCallback(
    (id: string) => {
      if (!signedIn) {
        openLogin();
        return;
      }
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [signedIn, openLogin],
  );

  return (
    <Stack gap="md">
      {!readOnly && myShifts.length > 0 && <MyShifts shifts={myShifts} onCancel={toggle} />}
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {Team.options.map((team) => (
          <Card key={team} withBorder radius="md" padding="md">
            <Badge color={TEAM_COLORS[team]} variant="light" mb={6}>
              {i18n._(TEAMS[team].name)}
            </Badge>
            <Text size="sm" c="dimmed">
              {i18n._(TEAMS[team].what)}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
      <Tabs value={day} onChange={(value) => value && onDayChange(value)} variant="pills" radius="xl">
        <Tabs.List mb="md">
          {days.map((d) => (
            <Tabs.Tab key={d} value={d} tt="capitalize">
              {formatDate(date(d), TAB_DATE)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {days.map((d) => {
          const list = byDay.get(d) ?? EMPTY_SHIFTS;
          return (
            <Tabs.Panel key={d} value={d}>
              {isMobile ? (
                <Stack gap="sm">
                  {list.map((shift) => (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      mine={mine.has(shift.id)}
                      readOnly={readOnly}
                      onToggle={toggle}
                    />
                  ))}
                </Stack>
              ) : (
                <Table verticalSpacing="sm">
                  <Table.Tbody>
                    {list.map((shift) => (
                      <ShiftRow
                        key={shift.id}
                        shift={shift}
                        mine={mine.has(shift.id)}
                        readOnly={readOnly}
                        userName={user?.name}
                        onToggle={toggle}
                      />
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </Stack>
  );
};
