import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, useMemo, type CSSProperties, type FC } from 'react';

import { isTraining, occurrences, type CalendarEvent } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { ArrowRight } from '~/components/ui';
import { GROUP_SLUGS, GROUPS } from '~/data/club';
import { useSeasons } from '~/hooks/useSeasons';
import { listFormat } from '~/i18n/current';
import { date, formatDate, ISO_DAY, wallNow, type Dayjs } from '~/utils/dates';
import { isLive, offTitles, plannedSessions, type PlannedSession } from '~/utils/training';

import { dayRange } from './schedule';

import classes from './CourtWeek.module.css';

const WEEKDAYS = [1, 2, 3, 4, 5];
const DEFAULT_TIMES = [{ start: '17:00', end: '22:00' }];

type Placed = { session: PlannedSession; lane: number };
type Axis = { first: number; span: number };

const thisMondayIso = () => wallNow().startOf('isoWeek').format(ISO_DAY);

const minuteOfDay = (d: Dayjs) => d.hour() * 60 + d.minute();

const timesOf = (s: PlannedSession) => ({ start: s.event.startTime ?? '00:00', end: s.event.endTime ?? '23:59' });

const placeInLanes = (sessions: readonly PlannedSession[]) => {
  const laneEnds: number[] = [];
  const placed: Placed[] = [];
  for (const session of sessions) {
    const start = minuteOfDay(session.start);
    const free = laneEnds.findIndex((end) => end <= start);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = minuteOfDay(session.end);
    placed.push({ session, lane });
  }
  return { placed, lanes: Math.max(1, laneEnds.length) };
};

const barStyle = ({ session, lane }: Placed, lanes: number, { first, span }: Axis) => {
  const color = session.off ? 'gray' : GROUPS[session.group].color;
  return {
    '--start': (minuteOfDay(session.start) - first) / span,
    '--end': (minuteOfDay(session.end) - first) / span,
    '--lane': lane,
    '--lanes': lanes,
    '--bar': `var(--mantine-color-${color}-light)`,
    '--bar-hover': `var(--mantine-color-${color}-light-hover)`,
    '--bar-ink': `var(--mantine-color-${color}-light-color)`,
  } as CSSProperties;
};

const otherEventsOn = (events: readonly CalendarEvent[], day: Dayjs, replacing: ReadonlySet<string>) =>
  events.filter((e) => !isTraining(e) && !replacing.has(e.id) && !occurrences(e, day, day).next().done);

const weekPlan = (events: readonly CalendarEvent[], monday: Dayjs) => {
  const sessions = plannedSessions(events, monday, monday.add(WEEKDAYS.length - 1, 'day'));
  const { first, last } = dayRange(sessions.length > 0 ? sessions.map(timesOf) : DEFAULT_TIMES);
  const axis = { first: Math.floor(first / 60) * 60, span: Math.ceil(last / 60) * 60 - Math.floor(first / 60) * 60 };
  const hours = Array.from({ length: axis.span / 60 + 1 }, (_, i) => {
    const hour = axis.first / 60 + i;
    return { label: `${String(hour).padStart(2, '0')}:00`, style: { '--at': (i * 60) / axis.span } as CSSProperties };
  });
  const days = WEEKDAYS.map((weekday) => {
    const day = monday.add(weekday - 1, 'day');
    const daySessions = sessions.filter((s) => s.day.isSame(day, 'day'));
    const replacing = new Set(daySessions.values().flatMap((s) => (s.off ? [s.off.id] : [])));
    const { placed, lanes } = placeInLanes(daySessions);
    return {
      day,
      bars: placed.map((p) => ({ session: p.session, style: barStyle(p, lanes, axis) })),
      allOff: daySessions.length > 0 && daySessions.every((s) => s.off),
      others: otherEventsOn(events, day, replacing),
    };
  });
  return { hours, days };
};

const HourLines = memo<{ hours: { label: string; style: CSSProperties }[] }>(({ hours }) =>
  hours.map(({ label, style }) => <span key={label} className={classes.hourLine} style={style} aria-hidden />),
);

export const CourtWeek: FC = () => {
  const { i18n, t } = useLingui();
  const { events } = useSiteContent();
  const { current } = useSeasons();
  const now = wallNow();
  const mondayIso = thisMondayIso();
  const { hours, days } = useMemo(() => weekPlan(events, date(mondayIso)), [events, mondayIso]);

  return (
    <Container component="section" pt={16} pb={56} aria-labelledby="court-week-title">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end" gap="sm">
          <div>
            <Text size="sm" fw={600} tt="uppercase" c="dimmed" className={classes.eyebrow}>
              {t`Week ${now.isoWeek()}`}
            </Text>
            <Title order={2} id="court-week-title">
              <Trans>This week in the hall</Trans>
            </Title>
          </div>
          <Button component={Link} to="/trening" variant="subtle" rightSection={<ArrowRight />}>
            <Trans>Full schedule</Trans>
          </Button>
        </Group>

        <div className={classes.week}>
          <div className={classes.axis} aria-hidden>
            {hours.map(({ label, style }) => (
              <span key={label} className={classes.tick} style={style}>
                {label}
              </span>
            ))}
          </div>

          <ol className={classes.days}>
            {days.map(({ day, bars, allOff, others }) => {
              const isToday = day.isSame(now, 'day');
              const isPast = day.isBefore(now, 'day');
              const open = bars.length > 0 && !allOff;
              const closedBy = allOff ? listFormat().format(offTitles(bars.map((b) => b.session))) : '';
              return (
                <li
                  key={day.valueOf()}
                  className={classes.day}
                  data-today={isToday || undefined}
                  data-past={isPast || undefined}
                >
                  <div className={classes.head}>
                    <Title order={3} className={classes.dayName}>
                      {formatDate(day, { weekday: 'long' })}
                    </Title>
                    <Text size="sm" c="dimmed" className="tabular">
                      {formatDate(day, { day: 'numeric', month: 'short' })}
                    </Text>
                    {isToday && (
                      <Badge size="sm" variant="filled" className={classes.todayBadge}>
                        <Trans>Today</Trans>
                      </Badge>
                    )}
                  </div>

                  <div className={classes.court} data-empty={bars.length === 0 || undefined}>
                    <HourLines hours={hours} />
                    {open &&
                      bars.map(({ session, style }) => {
                        const live = isLive(session, now);
                        const done = !session.end.isAfter(now);
                        const reason = session.off?.title;
                        return (
                          <Link
                            key={`${session.group}-${session.start.valueOf()}`}
                            to="/trening/$sesong"
                            params={{ sesong: current.id }}
                            search={{ gruppe: GROUP_SLUGS.toSlug(session.group) }}
                            className={classes.bar}
                            style={style}
                            data-done={done || undefined}
                            data-live={live || undefined}
                            data-off={reason ? true : undefined}
                          >
                            <span className={classes.barName}>{i18n._(GROUPS[session.group].name)}</span>
                            <span className={`${classes.barTime} tabular`}>
                              <span>{session.event.startTime}</span>
                              <span>–{session.event.endTime}</span>
                            </span>
                            {reason && <span className={classes.offNote}>{t`No training: ${reason}`}</span>}
                            {live && (
                              <Badge size="xs" color="green" variant="filled" className={classes.liveBadge}>
                                <Trans>On now</Trans>
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    {!open && (
                      <div className={classes.empty} data-closed={allOff || undefined}>
                        <Text size="sm" fw={600}>
                          <Trans>No training</Trans>
                        </Text>
                        {closedBy && (
                          <Text size="xs" c="dimmed">
                            {closedBy}
                          </Text>
                        )}
                        {others.map((e) => (
                          <Text key={e.id} size="xs" className={classes.other}>
                            {e.title}
                          </Text>
                        ))}
                      </div>
                    )}
                    {open && others.length > 0 && (
                      <div className={classes.others}>
                        {others.map((e) => (
                          <Text key={e.id} size="xs" className={classes.other}>
                            {e.title}
                          </Text>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Stack>
    </Container>
  );
};
