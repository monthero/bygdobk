import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Group as Row, Paper, Stack, Text, Title, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

import '@mantine/schedule/styles.css';
import { Schedule, type ScheduleEventData, type ScheduleLabelsOverride, type ScheduleProps } from '@mantine/schedule';
import { memo, useCallback, useMemo } from 'react';

import { affects, isTraining, occurrences, type CalendarEvent, type Occurrence, type Season } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { useGroups } from '~/cms/siteData';
import { AddressLink } from '~/components/ui';
import { GROUP_COLORS, type Group } from '~/data/club';
import { EVENT_KINDS } from '~/data/events';
import {
  CLOCK,
  date,
  dayjs,
  formatDate,
  formatDateRange,
  ISO_DAY,
  LONG_DATE,
  minutesOf,
  SHORT_DATE,
  today,
  weekdayName,
  type Dayjs,
} from '~/utils/dates';
import { plannedSessions, seasonTraining, weeklySessions } from '~/utils/training';

import classes from './TrainingSchedule.module.css';

const PHONE_QUERY = '(max-width: 47.99em)';
const SYNC_QUERY = { getInitialValueInEffect: false };
const VIEW_CLASS_NAMES = { headerControl: classes.headerControl };
const VIEW_HOURS = { startTime: '17:30:00', endTime: '22:30:00', intervalMinutes: 30, slotLabelInterval: 60 };

type WeekViewProps = NonNullable<ScheduleProps['weekViewProps']>;
type RenderEvent = NonNullable<WeekViewProps['renderEvent']>;
type Payload = { off?: string; faded?: boolean };

const renderWeekLabel: WeekViewProps['renderWeekLabel'] = ({ weekStart, weekEnd }) =>
  formatDateRange(date(weekStart), date(weekEnd), SHORT_DATE);

const payloadOf = (event: ScheduleEventData): Payload => event.payload ?? {};

const renderEvent: RenderEvent = (event, props) => {
  const { off, faded } = payloadOf(event);
  return (
    <UnstyledButton
      {...props}
      className={`${props.className ?? ''} ${classes.event}`}
      data-off={off ? true : undefined}
      data-faded={faded || undefined}
    />
  );
};

const DAY_VIEW_PROPS: ScheduleProps['dayViewProps'] = {
  ...VIEW_HOURS,
  headerFormat: (day) => formatDate(date(day), LONG_DATE),
  classNames: VIEW_CLASS_NAMES,
  renderEvent,
};

const scheduleTime = (d: Dayjs) => d.format('YYYY-MM-DD HH:mm:ss');

const WEEKDAY_CLOCK: Intl.DateTimeFormatOptions = { weekday: 'short', ...CLOCK };

const timeOf = ({ event, start, end }: Occurrence) => {
  if (!event.startTime && !event.endTime) return undefined;
  if (!event.endTime) return formatDate(start, CLOCK);
  return formatDateRange(start, end, start.isSame(end, 'day') ? CLOCK : WEEKDAY_CLOCK);
};

const VIEW_START = minutesOf(VIEW_HOURS.startTime);
const VIEW_END = minutesOf(VIEW_HOURS.endTime);

const minuteOfDay = (d: Dayjs) => d.hour() * 60 + d.minute();

const placement = ({ start, end }: Occurrence) => {
  if (start.isSame(end, 'day') && minuteOfDay(end) > VIEW_START && minuteOfDay(start) < VIEW_END) {
    return { start, end };
  }
  return { start: start.startOf('day'), end: end.subtract(1, 'second').endOf('day') };
};

const otherEvents = (events: readonly CalendarEvent[], season: Season, group: Group | undefined) =>
  events
    .values()
    .filter((e) => !isTraining(e) && (!group || affects(e, group)))
    .flatMap((e) => occurrences(e, season.start, season.end))
    .map((occurrence): ScheduleEventData<Payload> => {
      const { event, day } = occurrence;
      const { start, end } = placement(occurrence);
      const time = timeOf(occurrence);
      return {
        id: `${event.id}-${day.format(ISO_DAY)}`,
        title: [event.title, time].filter(Boolean).join(' · '),
        start: scheduleTime(start),
        end: scheduleTime(end),
        color: EVENT_KINDS[event.kind].color,
        variant: 'light',
        payload: { faded: true },
      };
    })
    .toArray();

type Props = { season: Season; group?: Group; height?: number };

const DayList = memo<Omit<Props, 'height'>>(({ season, group }) => {
  const groups = useGroups();
  const { events } = useSiteContent();
  const days = useMemo(
    () =>
      Map.groupBy(
        weeklySessions(seasonTraining(events, season)).filter((s) => !group || s.group === group),
        (s) => s.weekday,
      ),
    [events, season, group],
  );

  return (
    <Paper withBorder radius="lg" p="md">
      <Stack gap="md">
        {days.size === 0 && (
          <Text c="dimmed">
            <Trans>No training times yet.</Trans>
          </Text>
        )}
        {Array.from(days, ([weekday, sessions]) => (
          <Stack key={weekday} gap={8}>
            <Title order={3} size="h4" className="capitalize-first">
              {weekdayName(weekday)}
            </Title>
            {sessions.map((s) => (
              <Row key={`${s.group}-${s.start}-${s.venue?.name}`} justify="space-between" wrap="nowrap" gap="sm">
                <Stack gap={2}>
                  <Row gap={8} wrap="nowrap">
                    <Badge color={GROUP_COLORS[s.group]} variant="light">
                      {groups[s.group].name}
                    </Badge>
                    {groups[s.group].coached && (
                      <Text size="sm" c="dimmed">
                        <Trans>With coach</Trans>
                      </Text>
                    )}
                  </Row>
                  {s.venue && (
                    <Text size="sm" c="dimmed">
                      <AddressLink place={s.venue} />
                    </Text>
                  )}
                </Stack>
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
  const { t } = useLingui();
  const { events } = useSiteContent();
  const groups = useGroups();

  const scheduleEvents = useMemo<ScheduleEventData<Payload>[]>(
    () => [
      ...plannedSessions(events, season.start, season.end, group).map((s): ScheduleEventData<Payload> => ({
        id: `${s.event.id}-${s.day.format(ISO_DAY)}`,
        title: [groups[s.group].name, s.event.venue?.name].filter(Boolean).join(' · '),
        start: scheduleTime(s.start),
        end: scheduleTime(s.end),
        color: s.off ? 'gray' : GROUP_COLORS[s.group],
        variant: 'light',
        payload: { off: s.off?.title },
      })),
      ...otherEvents(events, season, group),
    ],
    [groups, events, season, group],
  );

  const renderEventBody = useCallback(
    (event: ScheduleEventData) => {
      const reason = payloadOf(event).off;
      return (
        <>
          <span className={classes.title}>{event.title}</span>
          {reason && <span className={classes.offNote}>{t`No training: ${reason}`}</span>}
        </>
      );
    },
    [t],
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
      renderEvent,
      withWeekendDays: false,
      highlightToday: true,
      withWeekNumber: true,
      slotHeight: 64,
      scrollAreaProps: { mah: height },
      classNames: VIEW_CLASS_NAMES,
    }),
    [height],
  );

  const now = today();
  const inSeason = !now.isBefore(season.start, 'day') && !now.isAfter(season.end, 'day');
  const opening = (inSeason ? now : season.start).format(ISO_DAY);

  return (
    <Schedule
      key={season.id}
      events={scheduleEvents}
      defaultDate={opening}
      defaultView="week"
      mode="static"
      labels={labels}
      locale={dayjs.locale()}
      renderEventBody={renderEventBody}
      weekViewProps={weekViewProps}
      dayViewProps={DAY_VIEW_PROPS}
    />
  );
});

export const TrainingSchedule = memo<Props>((props) => {
  const phone = useMediaQuery(PHONE_QUERY, false, SYNC_QUERY);
  return phone ? <DayList season={props.season} group={props.group} /> : <WeekSchedule {...props} />;
});
