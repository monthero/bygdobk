import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Container, Grid, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type CSSProperties, type FC } from 'react';

import { ArrowRight } from '~/components/ui';
import { CURRENT_SEASON, GROUP_SLUGS, GROUPS, Group as TrainingGroup } from '~/data/club';
import { numberFormat } from '~/i18n/current';
import { useClosures } from '~/stores/content';
import { dayjs, weekdayName } from '~/utils/dates';
import { closureOn, isLive } from '~/utils/training';

import { HeroActions } from '../HeroActions';
import { CourtNextTraining } from './CourtNextTraining';
import {
  BACK,
  FRONT,
  HALF,
  LENGTH,
  LINES,
  lineKey,
  LONG_SERVICE,
  MIDDLE,
  NET,
  SHORT_SERVICE,
  SINGLES,
  WIDTH,
  type Line,
} from './geometry';
import { slotsOf } from './schedule';

import classes from './CourtHero.module.css';

type Box = { x: number; y: number; w: number; h: number };

const boxStyle = ({ x, y, w, h }: Box) =>
  ({
    '--x': `${(x / LENGTH) * 100}%`,
    '--y': `${(y / WIDTH) * 100}%`,
    '--w': `${(w / LENGTH) * 100}%`,
    '--h': `${(h / WIDTH) * 100}%`,
  }) as CSSProperties;

const ZONE_W = FRONT - LONG_SERVICE;
const ZONE_H = MIDDLE - SINGLES;

const zone = (group: TrainingGroup, x: number, y: number) => {
  const { color } = GROUPS[group];
  return {
    group,
    style: {
      ...boxStyle({ x, y, w: ZONE_W, h: ZONE_H }),
      '--zone': `var(--mantine-color-${color}-light)`,
      '--zone-hover': `var(--mantine-color-${color}-light-hover)`,
      '--zone-ink': `var(--mantine-color-${color}-light-color)`,
    } as CSSProperties,
    slots: slotsOf(group),
  };
};

const ZONES = [
  zone(TrainingGroup.enum.rekrutt, LONG_SERVICE, SINGLES),
  zone(TrainingGroup.enum.junior, LONG_SERVICE, MIDDLE),
  zone(TrainingGroup.enum.senior, BACK, SINGLES),
  zone(TrainingGroup.enum.fritt, BACK, MIDDLE),
];

const HALVES = [
  { label: msg`Coached`, style: boxStyle({ x: FRONT, y: 0, w: SHORT_SERVICE, h: WIDTH }) },
  { label: msg`Play`, style: boxStyle({ x: HALF, y: 0, w: SHORT_SERVICE, h: WIDTH }) },
];

const transpose = ([x1, y1, x2, y2]: Line): Line => [y1, x1, y2, x2];

const VERTICAL_LINES = LINES.map(transpose);
const VERTICAL_NET = transpose(NET);

const CourtLines = memo<{ vertical?: boolean }>(({ vertical = false }) => {
  const lines = vertical ? VERTICAL_LINES : LINES;
  const net = vertical ? VERTICAL_NET : NET;
  const [w, h] = vertical ? [WIDTH, LENGTH] : [LENGTH, WIDTH];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={classes.lines}
      data-vertical={vertical || undefined}
      aria-hidden
      focusable="false"
    >
      <rect x={0} y={0} width={w} height={h} className={classes.line} />
      {lines.map(([x1, y1, x2, y2]) => (
        <line key={lineKey([x1, y1, x2, y2])} x1={x1} y1={y1} x2={x2} y2={y2} className={classes.line} />
      ))}
      <line x1={net[0]} y1={net[1]} x2={net[2]} y2={net[3]} className={classes.net} />
      <circle cx={net[0]} cy={net[1]} r={0.11} className={classes.post} />
      <circle cx={net[2]} cy={net[3]} r={0.11} className={classes.post} />
    </svg>
  );
});

const meters = (value: number) => `${numberFormat({ minimumFractionDigits: 2 }).format(value)} m`;

export const CourtHero: FC = () => {
  const { i18n, t } = useLingui();
  const closures = useClosures();
  const now = dayjs();
  const closedToday = Boolean(closureOn(now, closures));
  const todays = CURRENT_SEASON.schedule.filter((s) => !closedToday && s.weekday === now.isoWeekday());

  return (
    <section className={classes.hero}>
      <Container>
        <Grid gap={{ base: 32, md: 48 }} align="center">
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              <Title order={1} className={classes.title}>
                <Trans>Badminton for everyone at Bygdøhus</Trans>
              </Title>
              <Text size="lg" maw={520}>
                <Trans>
                  From your first swing to a full smash. Beginners, juniors and adults, three evenings a week.
                </Trans>
              </Text>
              <HeroActions size="md" />
              <CourtNextTraining />
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <figure className={classes.floor}>
              <figcaption className={classes.caption}>
                <Trans>Pick your group on the court</Trans>
              </figcaption>
              <div className={classes.court}>
                <CourtLines />
                <CourtLines vertical />
                <span className={classes.dimLength} aria-hidden>
                  {meters(LENGTH)}
                </span>
                <span className={classes.dimWidth} aria-hidden>
                  {meters(WIDTH)}
                </span>
                {HALVES.map(({ label, style }) => (
                  <span key={label.id} className={classes.half} style={style} aria-hidden>
                    {i18n._(label)}
                  </span>
                ))}
                <ul className={classes.zones} aria-label={t`Training groups`}>
                  {ZONES.map(({ group, style, slots }) => {
                    const { name, color } = GROUPS[group];
                    const today = todays.filter((s) => s.group === group);
                    const live = today.some((s) => isLive(s, now));
                    return (
                      <li key={group} className={classes.zoneItem} style={style}>
                        <Link
                          to="/trening/$sesong"
                          params={{ sesong: CURRENT_SEASON.id }}
                          search={{ gruppe: GROUP_SLUGS.toSlug(group) }}
                          className={classes.zone}
                        >
                          <span className={classes.zoneName}>{i18n._(name)}</span>
                          {slots.map((slot) => (
                            <span key={slot.start + slot.end} className={classes.zoneTime}>
                              <span>{slot.weekdays.map((d) => weekdayName(d, 'short')).join(', ')}</span>{' '}
                              <span className="tabular">
                                {slot.start}–{slot.end}
                              </span>
                            </span>
                          ))}
                          {today.length > 0 && (
                            <Badge
                              size="xs"
                              variant="filled"
                              color={live ? 'green' : color}
                              className={classes.zoneBadge}
                            >
                              {live ? <Trans>On now</Trans> : <Trans>Today</Trans>}
                            </Badge>
                          )}
                          <ArrowRight className={classes.zoneArrow} aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </figure>
          </Grid.Col>
        </Grid>
      </Container>
    </section>
  );
};
