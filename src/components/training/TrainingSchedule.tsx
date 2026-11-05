import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Group as Row, Paper, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Schedule, type ScheduleEventData, type ScheduleLabelsOverride, type ScheduleProps } from '@mantine/schedule';
import { memo, useMemo } from 'react';

import { GROUPS, type Group, type Season } from '~/data/club';
import { useClosures } from '~/stores/content';
import { date, dayjs, formatDate, formatDateRange, LONG_DATE, SHORT_DATE, weekdayName } from '~/utils/dates';
import { closureReason, closuresInSeason, type TrainingClosure } from '~/utils/training';

import classes from './TrainingSchedule.module.css';

const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const PHONE_QUERY = '(max-width: 47.99em)';
const SYNC_QUERY = { getInitialValueInEffect: false };
const WEEK_CLASS_NAMES = { headerControl: classes.headerControl };
const VIEW_HOURS = { startTime: '17:30:00', endTime: '22:30:00', intervalMinutes: 30, slotLabelInterval: 60 };
const DAY_VIEW_PROPS: ScheduleProps['dayViewProps'] = {
  ...VIEW_HOURS,
  headerFormat: (day) => formatDate(date(day), LONG_DATE),
  classNames: { headerControl: classes.headerControl },
};
type WeekViewProps = NonNullable<ScheduleProps['weekViewProps']>;
const renderWeekLabel: WeekViewProps['renderWeekLabel'] = ({ weekStart, weekEnd }) =>
  formatDateRange(date(weekStart), date(weekEnd), SHORT_DATE);
const untilOf = (season: Season) => `${season.end.replaceAll('-', '')}T235959`;

const firstOccurrence = (season: Season, weekday: number) => {
  const start = date(season.start);
  return start.add((weekday - start.isoWeekday() + 7) % 7, 'day');
};

const closedDates = (weekday: number, closures: readonly TrainingClosure[]) =>
  closures.flatMap((c) => {
    const out: string[] = [];
    for (let d = date(c.from); !d.isAfter(date(c.to)); d = d.add(1, 'day')) {
      if (d.isoWeekday() === weekday) out.push(d.format('YYYY-MM-DD'));
    }
    return out;
  });

type Props = { season: Season; group?: Group; height?: number };

const DayList = memo<Omit<Props, 'height'>>(({ season, group }) => {
  const { i18n } = useLingui();
  const days = useMemo(
    () =>
      Map.groupBy(
        season.schedule.filter((s) => !group || s.group === group),
        (s) => s.weekday,
      ),
    [season, group],
  );

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        {Array.from(days, ([weekday, sessions]) => (
          <Stack key={weekday} gap={8}>
            <Title order={3} size="h4" tt="capitalize">
              {weekdayName(weekday)}
            </Title>
            {sessions.map((s) => (
              <Row key={`${s.group}-${s.start}`} justify="space-between" wrap="nowrap" gap="sm">
                <Row gap={8} wrap="nowrap">
                  <Badge color={GROUPS[s.group].color} variant="light">
                    {i18n._(GROUPS[s.group].name)}
                  </Badge>
                  {GROUPS[s.group].coached && (
                    <Text size="sm" c="dimmed">
                      <Trans>With coach</Trans>
                    </Text>
                  )}
                </Row>
                <Text fw={600} className="tabular">
                  {s.start}–{s.end}
                </Text>
              </Row>
            ))}
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
});

const WeekSchedule = memo<Props>(({ season, group, height = 460 }) => {
  const { i18n, t } = useLingui();
  const all = useClosures();
  const closures = useMemo(() => closuresInSeason(all, season), [all, season]);

  const events = useMemo<ScheduleEventData[]>(
    () => [
      ...season.schedule
        .filter((s) => !group || s.group === group)
        .map((s, index) => {
          const first = firstOccurrence(season, s.weekday).format('YYYY-MM-DD');
          return {
            id: `session-${index}`,
            title: i18n._(GROUPS[s.group].name),
            start: `${first} ${s.start}:00`,
            end: `${first} ${s.end}:00`,
            color: GROUPS[s.group].color,
            variant: 'light' as const,
            recurrence: {
              rrule: `FREQ=WEEKLY;BYDAY=${BYDAY[s.weekday - 1]};UNTIL=${untilOf(season)}`,
              exdate: closedDates(s.weekday, closures).map((d) => `${d} ${s.start}:00`),
            },
          };
        }),
      ...closures.map((c) => ({
        id: `closure-${c.id}`,
        title: closureReason(i18n, c),
        start: `${c.from} 00:00:00`,
        end: `${c.to} 23:59:59`,
        color: 'gray',
        variant: 'light' as const,
      })),
    ],
    [i18n, closures, season, group],
  );

  const labels = useMemo<ScheduleLabelsOverride>(
    () => ({
      day: t`Day`,
      week: t`Week`,
      month: t`Month`,
      year: t`Year`,
      allDay: t`All day`,
      today: t`This week`,
      next: t`Next`,
      previous: t`Previous`,
      noEvents: t`No training`,
      agenda: t`List`,
    }),
    [t],
  );

  const weekViewProps = useMemo<ScheduleProps['weekViewProps']>(
    () => ({
      ...VIEW_HOURS,
      renderWeekLabel,
      withWeekendDays: false,
      highlightToday: true,
      withWeekNumber: true,
      slotHeight: 64,
      scrollAreaProps: { mah: height },
      classNames: WEEK_CLASS_NAMES,
    }),
    [height],
  );

  const today = dayjs().format('YYYY-MM-DD');
  const inSeason = season.start <= today && today <= season.end;
  const opening = inSeason ? today : season.start;

  return (
    <Schedule
      key={season.id}
      events={events}
      defaultDate={opening}
      defaultView="week"
      mode="static"
      labels={labels}
      locale={dayjs.locale()}
      weekViewProps={weekViewProps}
      dayViewProps={DAY_VIEW_PROPS}
    />
  );
});

export const TrainingSchedule = memo<Props>((props) => {
  const phone = useMediaQuery(PHONE_QUERY, false, SYNC_QUERY);
  return phone ? <DayList season={props.season} group={props.group} /> : <WeekSchedule {...props} />;
});
