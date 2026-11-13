import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Collapse, Group, Stack, Table, Text, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { Fragment, memo, useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { CaretDown, CaretDownBold, CaretUpBold, CrownSimple, Minus, Plus } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import { Partners, PlayStyle, ScoreMode, type Session, type Standing } from '~/shuttlekaos/model';
import { MatchResult } from '~/shuttlekaos/queries';
import { mergeParsed, safeJSONStorage } from '~/stores/persistence';

import { formOf, playersOf, RESULT_LABELS, TableVariant, type PlayerMap } from './labels';
import { PlayerNames } from './People';

import classes from './StandingsTable.module.css';

const SIGNED: Intl.NumberFormatOptions = { signDisplay: 'exceptZero' };
const AVERAGE: Intl.NumberFormatOptions = { maximumFractionDigits: 1 };
const RESULT_MARKS: Record<MatchResult, string> = {
  [MatchResult.enum.won]: '✓',
  [MatchResult.enum.drawn]: '–',
  [MatchResult.enum.lost]: '✗',
};

const DETAIL_STORAGE_KEY = 'bygdo-shuttlekaos-standings';

const StatsDetail = z.enum(['fewer', 'more']);
type StatsDetail = z.infer<typeof StatsDetail>;

const DetailData = z.object({ detail: StatsDetail.catch(StatsDetail.enum.fewer) });
type DetailData = z.infer<typeof DetailData>;

interface DetailState extends DetailData {
  setDetail: (detail: StatsDetail) => void;
}

const DETAIL_DEFAULTS: DetailData = { detail: StatsDetail.enum.fewer };

const useStatsDetail = create<DetailState>()(
  persist(
    (set) => ({
      ...DETAIL_DEFAULTS,
      setDetail: (detail) => set({ detail }),
    }),
    {
      name: DETAIL_STORAGE_KEY,
      storage: safeJSONStorage<DetailData>(),
      partialize: ({ detail }): DetailData => ({ detail }),
      merge: mergeParsed(DetailData, () => DETAIL_DEFAULTS),
    },
  ),
);

export const StatsTitle: FC<{ children: ReactNode }> = ({ children }) => (
  <Group justify="space-between" gap="sm" wrap="nowrap" className={classes.statsTitle}>
    {children}
    <StatsToggle />
  </Group>
);

export const StatsToggle: FC = () => {
  const detail = useStatsDetail((s) => s.detail);
  const setDetail = useStatsDetail((s) => s.setDetail);
  const more = detail === StatsDetail.enum.more;
  return (
    <Button
      variant="default"
      radius="xl"
      size="compact-sm"
      leftSection={more ? <Minus /> : <Plus />}
      onClick={() => setDetail(more ? StatsDetail.enum.fewer : StatsDetail.enum.more)}
    >
      {more ? <Trans>Fewer stats</Trans> : <Trans>More stats</Trans>}
    </Button>
  );
};

const signed = (n: number) => numberFormat(SIGNED).format(n);

const Abbr: FC<{ title: string; short: string }> = ({ title, short }) => <abbr title={title}>{short}</abbr>;

const ResultAbbr: FC<{ result: MatchResult }> = ({ result }) => {
  const { i18n } = useLingui();
  const { label, short } = RESULT_LABELS[result];
  return <Abbr title={i18n._(label)} short={i18n._(short)} />;
};

type Column = {
  key: string;
  header: ReactNode;
  cell: (row: Standing) => ReactNode;
  wide?: boolean;
  strong?: boolean;
  extra?: boolean;
};

const Move: FC<{ by: number | undefined }> = ({ by }) => {
  const { t } = useLingui();
  if (!by) {
    return (
      <span className={classes.move}>
        <span className={classes.still} aria-hidden />
        <VisuallyHidden>{t`No change`}</VisuallyHidden>
      </span>
    );
  }
  const steps = Math.abs(by);
  const up = by > 0;
  return (
    <span className={classes.move} data-up={up || undefined} data-down={!up || undefined}>
      <span className={classes.moveMark} aria-hidden>
        {up ? <CaretUpBold /> : <CaretDownBold />}
        {steps}
      </span>
      <VisuallyHidden>{up ? t`Up ${steps}` : t`Down ${steps}`}</VisuallyHidden>
    </span>
  );
};

const FormDetails: FC<{ session: Session; row: Standing }> = ({ session, row }) => {
  const { t } = useLingui();
  const form = formOf(session, row.playerIds);
  const played = form.played;
  const average = numberFormat(AVERAGE).format(form.average);
  return (
    <div className={classes.details}>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          <Trans>Matches</Trans>
        </Text>
        <Text fw={700}>{played}</Text>
      </Stack>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          <Trans>Points per match</Trans>
        </Text>
        <Text fw={700}>{average}</Text>
      </Stack>
      <Stack gap={4}>
        <Text size="xs" c="dimmed">
          <Trans>Last 5</Trans>
        </Text>
        <Group gap={4} aria-label={t`Last results, oldest first`}>
          {form.last.map((result, i) => (
            <span key={i} className={classes.dot} data-result={result}>
              {RESULT_MARKS[result]}
            </span>
          ))}
        </Group>
      </Stack>
    </div>
  );
};

type Props = {
  rows: Standing[];
  session: Session;
  players: PlayerMap;
  variant?: TableVariant;
  moves?: ReadonlyMap<string, number>;
  podium?: boolean;
  highlight?: string | null;
  adjustable?: boolean;
};

export const StandingsTable = memo<Props>(
  ({ rows, session, players, variant = TableVariant.enum.full, moves: allMoves, podium, highlight, adjustable }) => {
    const { t } = useLingui();
    const [expanded, setExpanded] = useState<string | null>(null);
    const detail = useStatsDetail((s) => s.detail);
    const fewer = adjustable && detail === StatsDetail.enum.fewer;
    const moves = fewer ? undefined : allMoves;
    const { settings } = session;
    const total = settings.scoreMode === ScoreMode.enum.total;
    const bestOfThree = !total && settings.sets === 3;
    const nobodyPlayed = rows.every((r) => r.played === 0);
    const expandable = variant === TableVariant.enum.final;
    const pairs = settings.style === PlayStyle.enum.doubles && settings.partners === Partners.enum.fixed;

    const points: Column = {
      key: 'points',
      header: <Abbr title={t`Points`} short={t({ message: 'Pts', comment: 'Short column heading for points' })} />,
      cell: (row) => row.pointsFor,
      strong: total,
    };
    const diff: Column = {
      key: 'diff',
      header: <Abbr title={t`Point difference`} short="+/−" />,
      cell: (row) => signed(row.pointsFor - row.pointsAgainst),
    };
    const scored: Column = {
      key: 'for',
      header: (
        <Abbr
          title={t`Points scored`}
          short={t({ message: 'F', comment: 'Short column heading for points scored (for)' })}
        />
      ),
      cell: (row) => row.pointsFor,
      extra: true,
    };
    const conceded: Column = {
      key: 'against',
      header: (
        <Abbr
          title={t`Points conceded`}
          short={t({ message: 'A', comment: 'Short column heading for points conceded (against)' })}
        />
      ),
      cell: (row) => row.pointsAgainst,
      extra: true,
    };
    const won: Column = {
      key: 'won',
      header: <ResultAbbr result={MatchResult.enum.won} />,
      cell: (row) => row.won,
      strong: !total,
    };

    let columns: Column[];
    if (variant === TableVariant.enum.compact) columns = [points];
    else if (variant === TableVariant.enum.final) {
      columns = [
        won,
        {
          key: 'drawn',
          header: <ResultAbbr result={MatchResult.enum.drawn} />,
          cell: (row) => row.drawn,
          wide: true,
        },
        {
          key: 'lost',
          header: <ResultAbbr result={MatchResult.enum.lost} />,
          cell: (row) => row.lost,
        },
        points,
        conceded,
        diff,
      ];
    } else {
      columns = [
        {
          key: 'played',
          header: (
            <Abbr title={t`Played`} short={t({ message: 'P', comment: 'Short column heading for matches played' })} />
          ),
          cell: (row) => row.played,
        },
        won,
        ...(bestOfThree
          ? [
              {
                key: 'games',
                header: <Trans comment="Column heading: games won and lost">Games</Trans>,
                cell: (row: Standing) => `${row.setsWon}–${row.setsLost}`,
                wide: true,
              },
            ]
          : []),
        ...(total ? [points] : [scored]),
        conceded,
        { ...diff, wide: total },
      ];
    }
    if (fewer) columns = columns.filter((c) => !c.extra);
    const span = columns.length + (moves ? 3 : 2);

    return (
      <Table className={classes.table} verticalSpacing={6} horizontalSpacing={6} data-variant={variant}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th className={classes.rank}>
              <Abbr title={t`Rank`} short="#" />
            </Table.Th>
            {moves && (
              <Table.Th className={classes.num}>
                <Abbr title={t`Change since last round`} short="↕" />
              </Table.Th>
            )}
            <Table.Th>{pairs ? t`Pair` : t`Player`}</Table.Th>
            {columns.map((c) => (
              <Table.Th key={c.key} className={classes.num} data-wide={c.wide || undefined}>
                {c.header}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => {
            const leader = row.rank === 1 && !nobodyPlayed;
            const open = expanded === row.entrantId;
            const me = Boolean(highlight && row.playerIds.includes(highlight));
            const names = <PlayerNames players={playersOf(players, row.playerIds)} />;
            return (
              <Fragment key={row.entrantId}>
                <Table.Tr
                  className={classes.row}
                  data-leader={leader || undefined}
                  data-podium={(podium && row.rank <= 3 && !nobodyPlayed) || undefined}
                  data-me={me || undefined}
                  data-open={open || undefined}
                >
                  <Table.Td className={classes.rank}>
                    {leader ? <CrownSimple className={classes.crown} aria-label={t`Leader`} /> : row.rank}
                  </Table.Td>
                  {moves && (
                    <Table.Td className={classes.num}>
                      <Move by={moves.get(row.entrantId)} />
                    </Table.Td>
                  )}
                  <Table.Td className={classes.name}>
                    {expandable ? (
                      <UnstyledButton
                        className={classes.expand}
                        aria-expanded={open}
                        onClick={() => setExpanded(open ? null : row.entrantId)}
                      >
                        {names}
                        <CaretDown className={classes.caret} aria-hidden />
                      </UnstyledButton>
                    ) : (
                      names
                    )}
                  </Table.Td>
                  {columns.map((c) => (
                    <Table.Td
                      key={c.key}
                      className={classes.num}
                      data-wide={c.wide || undefined}
                      fw={c.strong ? 700 : undefined}
                    >
                      {c.cell(row)}
                    </Table.Td>
                  ))}
                </Table.Tr>
                {expandable && (
                  <Table.Tr className={classes.detailsRow}>
                    <Table.Td colSpan={span} p={0}>
                      <Collapse expanded={open}>
                        <FormDetails session={session} row={row} />
                      </Collapse>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Fragment>
            );
          })}
        </Table.Tbody>
      </Table>
    );
  },
);
