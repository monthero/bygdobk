import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Collapse, Group, Stack, Table, Text, UnstyledButton } from '@mantine/core';
import { Fragment, memo, useState, type FC, type ReactNode } from 'react';

import { CaretDown, CrownSimple } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import { Partners, PlayStyle, ScoreMode, type Session, type Standing } from '~/shuttlekaos/model';

import { formOf, MatchResult, playersOf, TableVariant, type PlayerMap } from './labels';
import { PlayerNames } from './People';

import classes from './StandingsTable.module.css';

const SIGNED: Intl.NumberFormatOptions = { signDisplay: 'exceptZero' };
const AVERAGE: Intl.NumberFormatOptions = { maximumFractionDigits: 1 };
const RESULT_MARKS: Record<MatchResult, string> = {
  [MatchResult.enum.win]: '✓',
  [MatchResult.enum.draw]: '–',
  [MatchResult.enum.loss]: '✗',
};

const signed = (n: number) => numberFormat(SIGNED).format(n);

const Abbr: FC<{ title: string; short: string }> = ({ title, short }) => <abbr title={title}>{short}</abbr>;

type Column = { key: string; header: ReactNode; cell: (row: Standing) => ReactNode; wide?: boolean; strong?: boolean };

const Move: FC<{ by: number | undefined }> = ({ by }) => {
  const { t } = useLingui();
  if (!by) {
    return (
      <span className={classes.move} aria-label={t`No change`}>
        –
      </span>
    );
  }
  const steps = Math.abs(by);
  return by > 0 ? (
    <span className={classes.move} data-up aria-label={t`Up ${steps}`}>
      ▲{steps}
    </span>
  ) : (
    <span className={classes.move} data-down aria-label={t`Down ${steps}`}>
      ▼{steps}
    </span>
  );
};

const Streak: FC<{ result: MatchResult; count: number }> = ({ result, count }) => {
  if (result === MatchResult.enum.win) return <Plural value={count} one="# win in a row" other="# wins in a row" />;
  if (result === MatchResult.enum.loss) {
    return <Plural value={count} one="# loss in a row" other="# losses in a row" />;
  }
  return <Plural value={count} one="# draw in a row" other="# draws in a row" />;
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
      {form.streak && (
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            <Trans>Streak</Trans>
          </Text>
          <Text fw={700}>
            <Streak result={form.streak.result} count={form.streak.count} />
          </Text>
        </Stack>
      )}
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
};

export const StandingsTable = memo<Props>(
  ({ rows, session, players, variant = TableVariant.enum.full, moves, podium, highlight }) => {
    const { t } = useLingui();
    const [expanded, setExpanded] = useState<string | null>(null);
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
      strong: true,
    };
    const diff: Column = {
      key: 'diff',
      header: <Abbr title={t`Point difference`} short="+/−" />,
      cell: (row) => signed(row.pointsFor - row.pointsAgainst),
    };
    const won: Column = {
      key: 'won',
      header: <Abbr title={t`Won`} short={t({ message: 'W', comment: 'Short column heading for matches won' })} />,
      cell: (row) => row.won,
    };

    let columns: Column[];
    if (variant === TableVariant.enum.compact) columns = [points];
    else if (variant === TableVariant.enum.final) {
      columns = [
        won,
        {
          key: 'drawn',
          header: (
            <Abbr title={t`Drawn`} short={t({ message: 'D', comment: 'Short column heading for matches drawn' })} />
          ),
          cell: (row) => row.drawn,
          wide: true,
        },
        {
          key: 'lost',
          header: (
            <Abbr title={t`Lost`} short={t({ message: 'L', comment: 'Short column heading for matches lost' })} />
          ),
          cell: (row) => row.lost,
        },
        points,
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
        { ...diff, wide: total },
        ...(total ? [points] : []),
      ];
    }
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
            const names = <PlayerNames players={playersOf(players, row.playerIds)} />;
            return (
              <Fragment key={row.entrantId}>
                <Table.Tr
                  className={classes.row}
                  data-leader={leader || undefined}
                  data-podium={(podium && row.rank <= 3 && !nobodyPlayed) || undefined}
                  data-me={(highlight && row.playerIds.includes(highlight)) || undefined}
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
