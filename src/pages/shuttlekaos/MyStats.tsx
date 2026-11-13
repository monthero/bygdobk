import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Progress, Skeleton, Text, Tooltip } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';
import ChartBar from '~icons/ph/chart-bar';
import PlusMinus from '~icons/ph/plus-minus';

import { CalendarCheck, CrownSimple, MedalFill, Trophy } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import type { MyStats } from '~/shuttlekaos/queries';

import { BRAND, formatStart, RESULT_LABELS } from './labels';
import { PlayerAvatar } from './People';
import { Place, PlaceChip } from './PlaceChip';

import classes from './MyStats.module.css';

type Totals = MyStats['totals'];
type FormItem = MyStats['form'][number];
type MatchItem = MyStats['recentMatches'][number];
type Partner = MyStats['partners'][number];

const FORM_SHOWN = 5;
const TOP_SKELETONS = [0, 1];

const StatTile = z.enum(['sessions', 'wins', 'podiums', 'matches', 'points']);
type StatTile = z.infer<typeof StatTile>;

const TILE_INFO: Record<StatTile, { icon: ReactNode; label: MessageDescriptor }> = {
  [StatTile.enum.sessions]: {
    icon: <CalendarCheck />,
    label: msg({ message: 'Sessions', comment: 'Stats tile: finished sessions you played' }),
  },
  [StatTile.enum.wins]: {
    icon: <CrownSimple />,
    label: msg({ message: 'Wins', comment: 'Stats tile: sessions you finished first' }),
  },
  [StatTile.enum.podiums]: {
    icon: <MedalFill />,
    label: msg({ message: 'Podiums', comment: 'Stats tile: sessions where you finished in the top 3' }),
  },
  [StatTile.enum.matches]: {
    icon: <Trophy />,
    label: msg({ message: 'Matches won', comment: 'Stats tile: share of matches you won' }),
  },
  [StatTile.enum.points]: {
    icon: <PlusMinus />,
    label: msg({ message: 'Point difference', comment: 'Stats tile: points scored minus points conceded' }),
  },
};

const count = (n: number) => numberFormat().format(n);

const percent = (part: number, whole: number) =>
  whole > 0 ? numberFormat({ style: 'percent' }).format(part / whole) : '–';

const decimal = (n: number) => numberFormat({ maximumFractionDigits: 1 }).format(n);

const signed = (n: number) => numberFormat({ signDisplay: 'exceptZero' }).format(n);

type TileProps = { tile: StatTile; value: ReactNode; detail?: ReactNode; ghost?: boolean };

const Tile: FC<TileProps> = ({ tile, value, detail, ghost }) => {
  const { i18n } = useLingui();
  const { icon, label } = TILE_INFO[tile];
  return (
    <div className={classes.tile} data-ghost={ghost || undefined}>
      <span className={classes.tile__icon} aria-hidden>
        {icon}
      </span>
      <span className={classes.tile__value}>{value}</span>
      <span className={classes.tile__label}>{i18n._(label)}</span>
      {detail && <span className={classes.sub}>{detail}</span>}
    </div>
  );
};

export const StatTiles: FC<{ totals: Totals }> = ({ totals }) => {
  const { sessions, played, won, wins, podiums } = totals;
  const pointsFor = count(totals.pointsFor);
  const pointsAgainst = count(totals.pointsAgainst);
  const winShare = percent(wins, sessions);
  const podiumShare = percent(podiums, sessions);
  const tiles: Record<StatTile, Omit<TileProps, 'tile'>> = {
    [StatTile.enum.sessions]: {
      value: count(sessions),
      detail: <Plural value={played} one="# match" other="# matches" comment="Stats tile detail: matches played" />,
    },
    [StatTile.enum.wins]: {
      value: count(wins),
      detail: (
        <Trans comment="Stats tile detail: share of sessions you won, e.g. 22% of sessions">
          {winShare} of sessions
        </Trans>
      ),
    },
    [StatTile.enum.podiums]: {
      value: count(podiums),
      detail: (
        <Trans comment="Stats tile detail: share of sessions you finished top 3, e.g. Top 3 in 48%">
          Top 3 in {podiumShare}
        </Trans>
      ),
    },
    [StatTile.enum.matches]: {
      value: percent(won, played),
      detail: (
        <>
          <Trans comment="Stats tile detail: matches won out of played, e.g. 7 of 12">
            {won} of {played}
          </Trans>
          <Progress
            value={played > 0 ? (won / played) * 100 : 0}
            size={6}
            radius="xl"
            className={classes.tile__bar}
            aria-hidden
          />
        </>
      ),
    },
    [StatTile.enum.points]: {
      value: signed(totals.pointsFor - totals.pointsAgainst),
      detail: (
        <Trans comment="Stats tile detail: points scored and conceded">
          {pointsFor} for · {pointsAgainst} against
        </Trans>
      ),
    },
  };
  return (
    <div className={classes.tiles}>
      {StatTile.options.map((tile) => (
        <Tile key={tile} tile={tile} {...tiles[tile]} />
      ))}
    </div>
  );
};

export const EmptyStats: FC = () => (
  <>
    <div className={classes.empty}>
      <span className={classes.empty__art} aria-hidden>
        <ChartBar />
      </span>
      <h2 className={classes.empty__title}>
        <Trans comment="Title when you have no stats yet">Your stats start here</Trans>
      </h2>
      <p className={classes.empty__text}>
        <Trans>Finish one session and we'll keep score of your wins, podiums and form.</Trans>
      </p>
    </div>
    <div className={classes.tiles}>
      {StatTile.options.map((tile) => (
        <Tile key={tile} tile={tile} value="–" ghost />
      ))}
    </div>
  </>
);

const FormChip: FC<{ item: FormItem }> = ({ item }) => (
  <Tooltip label={`${item.title || BRAND} · ${formatStart(item.startedAt)}`} withArrow>
    <Link to="/shuttlekaos/$code" params={{ code: item.shareCode }} className={classes.formLink}>
      <PlaceChip rank={item.rank} />
    </Link>
  </Tooltip>
);

const StatsSummary: FC<{ totals: Totals; form: FormItem[] }> = ({ totals, form }) => {
  const { averagePlace, bestPlace } = totals;
  return (
    <div className={classes.summary}>
      <div className={classes.stack}>
        <span className={classes.label}>
          <Trans comment="Your average place in sessions">Average place</Trans>
        </span>
        <span className={classes.big}>{averagePlace === null ? '–' : decimal(averagePlace)}</span>
        {bestPlace !== null && (
          <span className={classes.sub}>
            <Trans comment="Your best place, e.g. Best: 1st">
              Best: <Place rank={bestPlace} />
            </Trans>
          </span>
        )}
      </div>
      <div className={classes.stack}>
        <span className={classes.label}>
          <Trans comment="Heading for your places in your latest sessions">Form</Trans>
        </span>
        <ol className={classes.chips}>
          {form.slice(-FORM_SHOWN).map((item) => (
            <li key={item.shareCode}>
              <FormChip item={item} />
            </li>
          ))}
        </ol>
        <span className={classes.sub}>
          <Trans comment="Under your places in your latest sessions">Last 5, newest on the right</Trans>
        </span>
      </div>
    </div>
  );
};

const RecentMatches: FC<{ matches: MatchItem[] }> = ({ matches }) => {
  const { t, i18n } = useLingui();
  const [picked, setPicked] = useState<number | null>(null);
  const shown = matches.at(picked ?? -1);
  if (!shown) return null;
  const matchText = (match: MatchItem) => {
    const result = i18n._(RESULT_LABELS[match.result].label);
    const score = `${match.pointsFor}–${match.pointsAgainst}`;
    return t({ message: `${result} ${score}`, comment: 'A match result and its score, e.g. Won 21–15' });
  };
  const roundText = (number: number) => t`Round ${number}`;
  return (
    <div className={classes.card}>
      <span className={classes.label}>
        <Plural
          value={matches.length}
          one="Last match"
          other="Last # matches"
          comment="Heading for your latest match results"
        />
      </span>
      <ol className={classes.matches}>
        {matches.map((match, index) => (
          <li key={`${match.shareCode}:${match.round}`}>
            <button
              type="button"
              className={classes.result}
              data-result={match.result}
              aria-pressed={match === shown}
              aria-label={`${matchText(match)} · ${roundText(match.round)}`}
              onClick={() => setPicked(index)}
            >
              {i18n._(RESULT_LABELS[match.result].short)}
            </button>
          </li>
        ))}
      </ol>
      <div className={classes.stack}>
        <Text fw={700}>{matchText(shown)}</Text>
        <Link to="/shuttlekaos/$code" params={{ code: shown.shareCode }} className={classes.matchLink}>
          {shown.title || BRAND} · {roundText(shown.round)}
        </Link>
      </div>
    </div>
  );
};

export const StatsOverview: FC<{ stats: MyStats }> = ({ stats }) => (
  <div className={classes.top}>
    <StatsSummary totals={stats.totals} form={stats.form} />
    <RecentMatches matches={stats.recentMatches} />
  </div>
);

export const PartnerList: FC<{ partners: Partner[] }> = ({ partners }) => {
  if (partners.length === 0) {
    return (
      <Text c="dimmed">
        <Trans>No doubles partners yet.</Trans>
      </Text>
    );
  }
  return (
    <ol className={classes.partners}>
      {partners.map((partner) => {
        const { played, won } = partner;
        return (
          <li key={partner.profileId ?? `name:${partner.name.toLocaleLowerCase()}`} className={classes.partner}>
            <PlayerAvatar player={partner} size={44} />
            <div className={classes.stack}>
              <Text fw={700} className={classes.ellipsis}>
                {partner.name}
              </Text>
              <span className={classes.sub}>
                <Plural
                  value={played}
                  one="# match together"
                  other="# matches together"
                  comment="Matches you played on the same side as this partner"
                />
              </span>
            </div>
            <div className={classes.score}>
              <span className={classes.score__value}>{percent(won, played)}</span>
              <span className={classes.sub}>
                <Trans comment="Matches won out of matches played, e.g. 3 of 5 won">
                  {won} of {played} won
                </Trans>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export const StatsSkeleton: FC = () => (
  <>
    <div className={classes.top} aria-busy>
      {TOP_SKELETONS.map((i) => (
        <Skeleton key={i} height={128} radius={18} />
      ))}
    </div>
    <div className={classes.tiles} aria-busy>
      {StatTile.options.map((tile) => (
        <Skeleton key={tile} height={132} radius={16} />
      ))}
    </div>
  </>
);
