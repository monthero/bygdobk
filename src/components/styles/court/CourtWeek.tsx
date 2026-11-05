import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type CSSProperties, type FC } from 'react';

import { ArrowRight } from '~/components/ui';
import { CURRENT_SEASON, GROUP_SLUGS, GROUPS, type Session } from '~/data/club';
import { useClosures } from '~/stores/content';
import { dayjs, formatDate, minutesOf } from '~/utils/dates';
import { closureOn, closureReason, isLive } from '~/utils/training';

import { dayRange } from './schedule';

import classes from './CourtWeek.module.css';

const SCHEDULE = CURRENT_SEASON.schedule;
const { first: FIRST, last: LAST } = dayRange(SCHEDULE);
const SPAN = LAST - FIRST;
const WEEKDAYS = [1, 2, 3, 4, 5];

const HOURS = Array.from({ length: Math.floor(LAST / 60) - Math.ceil(FIRST / 60) + 1 }, (_, i) => {
  const hour = Math.ceil(FIRST / 60) + i;
  return {
    label: `${String(hour).padStart(2, '0')}:00`,
    style: { '--at': (hour * 60 - FIRST) / SPAN } as CSSProperties,
  };
});

type Placed = { session: Session; lane: number };

const placeInLanes = (sessions: readonly Session[]) => {
  const laneEnds: number[] = [];
  const placed: Placed[] = [];
  for (const session of [...sessions].sort((a, b) => minutesOf(a.start) - minutesOf(b.start))) {
    const start = minutesOf(session.start);
    const free = laneEnds.findIndex((end) => end <= start);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = minutesOf(session.end);
    placed.push({ session, lane });
  }
  return { placed, lanes: Math.max(1, laneEnds.length) };
};

const barStyle = ({ session, lane }: Placed, lanes: number) => {
  const { color } = GROUPS[session.group];
  return {
    '--start': (minutesOf(session.start) - FIRST) / SPAN,
    '--end': (minutesOf(session.end) - FIRST) / SPAN,
    '--lane': lane,
    '--lanes': lanes,
    '--bar': `var(--mantine-color-${color}-light)`,
    '--bar-hover': `var(--mantine-color-${color}-light-hover)`,
    '--bar-ink': `var(--mantine-color-${color}-light-color)`,
  } as CSSProperties;
};

const DAYS = WEEKDAYS.map((weekday) => {
  const { placed, lanes } = placeInLanes(SCHEDULE.filter((s) => s.weekday === weekday));
  return { weekday, bars: placed.map((p) => ({ session: p.session, style: barStyle(p, lanes) })) };
});

const HourLines = memo(() =>
  HOURS.map(({ label, style }) => <span key={label} className={classes.hourLine} style={style} aria-hidden />),
);

export const CourtWeek: FC = () => {
  const { i18n, t } = useLingui();
  const closures = useClosures();
  const now = dayjs();
  const monday = now.startOf('isoWeek');
  const nowMinutes = now.hour() * 60 + now.minute();

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
            {HOURS.map(({ label, style }) => (
              <span key={label} className={classes.tick} style={style}>
                {label}
              </span>
            ))}
          </div>

          <ol className={classes.days}>
            {DAYS.map(({ weekday, bars }) => {
              const day = monday.add(weekday - 1, 'day');
              const isToday = day.isSame(now, 'day');
              const isPast = day.isBefore(now, 'day');
              const closure = bars.length > 0 ? closureOn(day, closures) : undefined;
              const open = bars.length > 0 && !closure;
              return (
                <li
                  key={weekday}
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
                    <HourLines />
                    {open &&
                      bars.map(({ session, style }) => {
                        const live = isLive(session, now);
                        const done = isPast || (isToday && minutesOf(session.end) <= nowMinutes);
                        return (
                          <Link
                            key={`${session.group}-${session.start}`}
                            to="/trening/$sesong"
                            params={{ sesong: CURRENT_SEASON.id }}
                            search={{ gruppe: GROUP_SLUGS.toSlug(session.group) }}
                            className={classes.bar}
                            style={style}
                            data-done={done || undefined}
                            data-live={live || undefined}
                          >
                            <span className={classes.barName}>{i18n._(GROUPS[session.group].name)}</span>
                            <span className={`${classes.barTime} tabular`}>
                              <span>{session.start}</span>
                              <span>–{session.end}</span>
                            </span>
                            {live && (
                              <Badge size="xs" color="green" variant="filled" className={classes.liveBadge}>
                                <Trans>On now</Trans>
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    {!open && (
                      <div className={classes.empty} data-closed={closure ? true : undefined}>
                        <Text size="sm" fw={600}>
                          <Trans>No training</Trans>
                        </Text>
                        {closure && (
                          <Text size="xs" c="dimmed">
                            {closureReason(i18n, closure)}
                          </Text>
                        )}
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
