import { Trans, useLingui } from '@lingui/react/macro';
import { Table, Text } from '@mantine/core';
import { memo, type FC } from 'react';

import { CrownSimple } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import { Partners, PlayStyle, ScoreMode, type Settings, type Standing } from '~/shuttlekaos/model';

import { playersOf, type PlayerMap } from './labels';
import { PlayerNames } from './People';

import classes from './StandingsTable.module.css';

const SIGNED: Intl.NumberFormatOptions = { signDisplay: 'exceptZero' };

const signed = (n: number) => numberFormat(SIGNED).format(n);

type Props = {
  rows: Standing[];
  settings: Settings;
  players: PlayerMap;
  moves?: ReadonlyMap<string, number>;
  podium?: boolean;
  highlight?: string | null;
};

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

export const StandingsTable = memo<Props>(({ rows, settings, players, moves, podium, highlight }) => {
  const { t } = useLingui();
  const total = settings.scoreMode === ScoreMode.enum.total;
  const bestOfThree = !total && settings.sets === 3;
  const nobodyPlayed = rows.every((r) => r.played === 0);

  return (
    <Table className={classes.table} verticalSpacing={6} horizontalSpacing={6}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th className={classes.rank}>
            <abbr title={t`Rank`}>#</abbr>
          </Table.Th>
          {moves && (
            <Table.Th className={classes.num}>
              <abbr title={t`Change since last round`}>↕</abbr>
            </Table.Th>
          )}
          <Table.Th>
            {settings.style === PlayStyle.enum.doubles && settings.partners === Partners.enum.fixed
              ? t`Pair`
              : t`Player`}
          </Table.Th>
          <Table.Th className={classes.num}>
            <abbr title={t`Played`}>{t({ message: 'P', comment: 'Short column heading for matches played' })}</abbr>
          </Table.Th>
          <Table.Th className={classes.num}>
            <abbr title={t`Won`}>{t({ message: 'W', comment: 'Short column heading for matches won' })}</abbr>
          </Table.Th>
          {bestOfThree && (
            <Table.Th className={classes.num} data-wide>
              <Trans comment="Column heading: games won and lost">Games</Trans>
            </Table.Th>
          )}
          <Table.Th className={classes.num} data-wide={total || undefined}>
            <abbr title={t`Point difference`}>+/−</abbr>
          </Table.Th>
          {total && (
            <Table.Th className={classes.num}>
              <abbr title={t`Points`}>{t({ message: 'Pts', comment: 'Short column heading for points' })}</abbr>
            </Table.Th>
          )}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => {
          const leader = row.rank === 1 && !nobodyPlayed;
          return (
            <Table.Tr
              key={row.entrantId}
              className={classes.row}
              data-leader={leader || undefined}
              data-podium={(podium && row.rank <= 3 && !nobodyPlayed) || undefined}
              data-me={(highlight && row.playerIds.includes(highlight)) || undefined}
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
                <PlayerNames players={playersOf(players, row.playerIds)} />
              </Table.Td>
              <Table.Td className={classes.num}>{row.played}</Table.Td>
              <Table.Td className={classes.num}>{row.won}</Table.Td>
              {bestOfThree && (
                <Table.Td className={classes.num} data-wide>
                  {row.setsWon}–{row.setsLost}
                </Table.Td>
              )}
              <Table.Td className={classes.num} data-wide={total || undefined}>
                {signed(row.pointsFor - row.pointsAgainst)}
              </Table.Td>
              {total && (
                <Table.Td className={classes.num}>
                  <Text span fw={700} inherit>
                    {row.pointsFor}
                  </Text>
                </Table.Td>
              )}
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
});
