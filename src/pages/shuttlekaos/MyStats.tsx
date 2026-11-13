import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, SelectOrdinal, Trans, useLingui } from '@lingui/react/macro';
import { LineChart, type LineChartSeries } from '@mantine/charts';
import { Button, Paper, Skeleton, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useMemo, type FC, type ReactNode } from 'react';
import type { TooltipContentProps } from 'recharts';

import { ArrowRight } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import { LoadError } from '~/pages/board/LoadError';
import { useMyStats, type MyStats } from '~/shuttlekaos/queries';
import { formatDate, wallTime } from '~/utils/dates';

import { BRAND, formatStart } from './labels';
import { PlayerAvatar } from './People';

import classes from './MyStats.module.css';

type Totals = MyStats['totals'];
type FormItem = MyStats['form'][number];
type Partner = MyStats['partners'][number];

const TILE_SKELETONS = [0, 1, 2, 3];
const FULL_SKELETONS = [0, 1, 2, 3, 4, 5];
const CHART_HEIGHT = 220;
const FINISH_TICKS = [0, 50, 100];
const AXIS_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
const X_AXIS = { minTickGap: 16 };
const DOT = { r: 4, strokeWidth: 2 };
const ACTIVE_DOT = { r: 6, strokeWidth: 2 };
const SERIES: LineChartSeries[] = [{ name: 'finish', color: 'var(--bk-accent-strong)' }];

const FINISH_LABELS: Record<number, MessageDescriptor> = {
  0: msg({ message: 'Last', comment: 'Form chart axis: finished last in a session' }),
  50: msg({ message: 'Middle', comment: 'Form chart axis: finished in the middle of the field' }),
  100: msg({ message: 'Top', comment: 'Form chart axis: finished first in a session' }),
};

const percent = (part: number, whole: number) =>
  whole > 0 ? numberFormat({ style: 'percent' }).format(part / whole) : '–';

const decimal = (n: number) => numberFormat({ maximumFractionDigits: 1 }).format(n);

const signed = (n: number) => numberFormat({ signDisplay: 'exceptZero' }).format(n);

const finishOf = ({ rank, entrants }: FormItem) => (entrants > 1 ? ((entrants - rank) / (entrants - 1)) * 100 : 100);

const Place: FC<{ rank: number }> = ({ rank }) => (
  <SelectOrdinal value={rank} one="#st" two="#nd" few="#rd" other="#th" comment="A place in a session, e.g. 3rd" />
);

const PlaceOf: FC<{ item: FormItem }> = ({ item }) => {
  const { entrants } = item;
  return (
    <Trans comment="Your place out of all players or pairs, e.g. 3rd of 13">
      <Place rank={item.rank} /> of {entrants}
    </Trans>
  );
};

const WonOf: FC<{ won: number; played: number }> = ({ won, played }) => (
  <Trans comment="Matches won out of matches played, e.g. 3 of 5 won">
    {won} of {played} won
  </Trans>
);

type TileProps = { label: ReactNode; value: ReactNode; detail?: ReactNode };

const StatTile: FC<TileProps> = ({ label, value, detail }) => (
  <Paper withBorder radius="lg" className={classes.tile}>
    <Text size="sm" c="dimmed" className={classes.tile__label}>
      {label}
    </Text>
    <span className={classes.tile__value}>{value}</span>
    {detail && (
      <Text size="xs" c="dimmed">
        {detail}
      </Text>
    )}
  </Paper>
);

export const StatTiles: FC<{ totals: Totals; full?: boolean }> = ({ totals, full }) => {
  const { played, won, lost, drawn, bestPlace, wins, pointsFor, pointsAgainst } = totals;
  return (
    <div className={classes.tiles} data-full={full || undefined}>
      <StatTile
        label={<Trans comment="Stats tile: finished sessions you played">Sessions</Trans>}
        value={totals.sessions}
        detail={
          full ? undefined : (
            <Plural value={played} one="# match" other="# matches" comment="Stats tile detail: matches played" />
          )
        }
      />
      {full && (
        <StatTile
          label={<Trans comment="Stats tile: matches you played">Matches</Trans>}
          value={played}
          detail={
            drawn > 0 ? (
              <Trans comment="Stats tile detail">
                {won} won · {lost} lost · {drawn} drawn
              </Trans>
            ) : (
              <Trans comment="Stats tile detail">
                {won} won · {lost} lost
              </Trans>
            )
          }
        />
      )}
      <StatTile
        label={<Trans comment="Stats tile: share of matches you won">Matches won</Trans>}
        value={percent(won, played)}
        detail={
          <Trans comment="Stats tile detail: matches won out of played, e.g. 7 of 12">
            {won} of {played}
          </Trans>
        }
      />
      <StatTile
        label={<Trans comment="Stats tile: your average place in sessions">Average place</Trans>}
        value={totals.averagePlace === null ? '–' : decimal(totals.averagePlace)}
        detail={
          bestPlace !== null && (
            <Trans comment="Stats tile detail: your best place, e.g. Best: 1st">
              Best: <Place rank={bestPlace} />
            </Trans>
          )
        }
      />
      <StatTile
        label={<Trans comment="Stats tile: sessions where you finished in the top 3">Podiums</Trans>}
        value={totals.podiums}
        detail={
          <Plural
            value={wins}
            one="Won # session"
            other="Won # sessions"
            comment="Stats tile detail: sessions you finished first"
          />
        }
      />
      {full && (
        <StatTile
          label={<Trans comment="Stats tile: points scored minus points conceded">Point difference</Trans>}
          value={signed(pointsFor - pointsAgainst)}
          detail={
            <Trans comment="Stats tile detail: points scored and conceded">
              {pointsFor} for · {pointsAgainst} against
            </Trans>
          }
        />
      )}
    </div>
  );
};

export const StatTilesSkeleton: FC<{ full?: boolean }> = ({ full }) => (
  <div className={classes.tiles} data-full={full || undefined} aria-busy>
    {(full ? FULL_SKELETONS : TILE_SKELETONS).map((i) => (
      <Skeleton key={i} height={96} radius="lg" />
    ))}
  </div>
);

type Point = FormItem & { label: string; finish: number };

const FormTooltip: FC<TooltipContentProps<number, string>> = ({ active, payload }) => {
  const point: Point | undefined = payload?.at(0)?.payload;
  if (!active || !point) return null;
  return (
    <Paper withBorder radius="md" shadow="md" className={classes.tooltip}>
      <Text size="sm" fw={700} className={classes.ellipsis}>
        {point.title || BRAND}
      </Text>
      <Text size="xs" c="dimmed">
        {formatStart(point.startedAt)}
      </Text>
      <Text size="sm" fw={600}>
        <PlaceOf item={point} />
      </Text>
      <Text size="xs">
        <WonOf won={point.won} played={point.played} />
      </Text>
    </Paper>
  );
};

const renderTooltip = (props: TooltipContentProps<number, string>) => <FormTooltip {...props} />;

const TOOLTIP_PROPS = { content: renderTooltip };

export const FormChart: FC<{ form: FormItem[] }> = ({ form }) => {
  const { i18n } = useLingui();
  const data = useMemo<Point[]>(
    () =>
      form.map((item) => ({
        ...item,
        label: formatDate(wallTime(item.startedAt), AXIS_DATE),
        finish: finishOf(item),
      })),
    [form],
  );
  const yAxis = useMemo(
    () => ({
      domain: [0, 100],
      ticks: FINISH_TICKS,
      width: 64,
      tickFormatter: (value: number) => {
        const label = FINISH_LABELS[value];
        return label ? i18n._(label) : '';
      },
    }),
    [i18n],
  );

  if (form.length < 2) {
    return (
      <Text c="dimmed">
        <Trans>Play one more session to see your form.</Trans>
      </Text>
    );
  }

  return (
    <LineChart
      h={CHART_HEIGHT}
      data={data}
      dataKey="label"
      series={SERIES}
      curveType="monotone"
      gridAxis="x"
      tickLine="none"
      strokeDasharray="0"
      strokeWidth={2}
      dotProps={DOT}
      activeDotProps={ACTIVE_DOT}
      yAxisProps={yAxis}
      xAxisProps={X_AXIS}
      tooltipProps={TOOLTIP_PROPS}
      tooltipAnimationDuration={150}
      className={classes.chart}
    />
  );
};

export const PartnerList: FC<{ partners: Partner[] }> = ({ partners }) => {
  if (partners.length === 0) {
    return (
      <Text c="dimmed">
        <Trans>No doubles partners yet.</Trans>
      </Text>
    );
  }
  return (
    <ol className={classes.list}>
      {partners.map((partner) => {
        const { played } = partner;
        return (
          <li key={partner.profileId ?? `name:${partner.name.toLocaleLowerCase()}`} className={classes.row}>
            <PlayerAvatar player={partner} />
            <div className={classes.row__text}>
              <Text fw={700} className={classes.ellipsis}>
                {partner.name}
              </Text>
              <Text size="sm" c="dimmed">
                <Plural
                  value={played}
                  one="# match together"
                  other="# matches together"
                  comment="Matches you played on the same side as this partner"
                />
              </Text>
            </div>
            <div className={classes.row__score}>
              <Text fw={700}>{percent(partner.won, played)}</Text>
              <Text size="xs" c="dimmed">
                <WonOf won={partner.won} played={played} />
              </Text>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const SessionResults: FC<{ form: FormItem[] }> = ({ form }) => (
  <ol className={classes.list}>
    {form.toReversed().map((item) => (
      <li key={item.shareCode}>
        <Link to="/shuttlekaos/$code" params={{ code: item.shareCode }} className={classes.link}>
          <span className={classes.place} data-podium={item.rank <= 3 || undefined}>
            <Place rank={item.rank} />
          </span>
          <div className={classes.row__text}>
            <Text fw={700} className={classes.ellipsis}>
              {item.title || BRAND}
            </Text>
            <Text size="sm" c="dimmed">
              {formatStart(item.startedAt)}
            </Text>
          </div>
          <div className={classes.row__score}>
            <Text size="sm" fw={600}>
              <PlaceOf item={item} />
            </Text>
            <Text size="xs" c="dimmed">
              <WonOf won={item.won} played={item.played} />
            </Text>
          </div>
        </Link>
      </li>
    ))}
  </ol>
);

const StatsLink: FC = () => (
  <Button
    variant="light"
    rightSection={<ArrowRight />}
    className={classes.more}
    renderRoot={(props) => <Link {...props} to="/shuttlekaos/statistikk" />}
  >
    <Trans>See all your stats</Trans>
  </Button>
);

type TeaserProps = { hasHistory: boolean; children: (content: ReactNode) => ReactNode };

export const StatsTeaser: FC<TeaserProps> = ({ hasHistory, children }) => {
  const { t } = useLingui();
  const stats = useMyStats();
  if (stats.isPending) return hasHistory ? children(<StatTilesSkeleton />) : null;
  if (stats.isError) {
    return children(
      <LoadError
        title={t`Couldn't load your stats`}
        error={stats.error}
        retrying={stats.isRefetching}
        onRetry={() => void stats.refetch()}
      />,
    );
  }
  if (stats.data.totals.sessions === 0) return null;
  return children(
    <>
      <StatTiles totals={stats.data.totals} />
      <StatsLink />
    </>,
  );
};
