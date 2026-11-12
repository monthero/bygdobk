import { Trans } from '@lingui/react/macro';
import { Badge, Button, Paper, Text } from '@mantine/core';
import { memo } from 'react';

import { CheckCircle, PencilSimple, Trophy } from '~/components/ui';
import { gamesProblem, matchWinner } from '~/shuttlekaos/engine';
import type { Match, Settings } from '~/shuttlekaos/model';

import { playersOf, type PlayerMap } from './labels';
import { PlayerNames } from './People';

import classes from './CourtCard.module.css';

type Props = {
  match: Match;
  settings: Settings;
  players: PlayerMap;
  onEdit?: (matchId: string) => void;
};

export const CourtCard = memo<Props>(({ match, settings, players, onEdit }) => {
  const done = gamesProblem(settings, match.games) === null;
  const winner = done ? matchWinner(settings, match) : null;
  const court = match.court;

  return (
    <Paper withBorder radius="lg" className={classes.card} data-done={done || undefined}>
      <div className={classes.head}>
        <Text fw={700} className={classes.court}>
          <Trans>Court {court}</Trans>
        </Text>
        {done ? (
          <Badge color="teal" variant="light" leftSection={<CheckCircle />}>
            <Trans comment="A court whose score is entered">Done</Trans>
          </Badge>
        ) : (
          <Badge color="gray" variant="light">
            <Trans comment="A court still playing, no score yet">Playing</Trans>
          </Badge>
        )}
      </div>
      {match.sides.map((ids, side) => {
        const result = winner === null ? undefined : winner === side;
        return (
          <div
            key={side}
            className={classes.side}
            data-won={result === true || undefined}
            data-lost={result === false || undefined}
          >
            <PlayerNames players={playersOf(players, ids)} stacked />
            <span className={classes.score}>
              {result === true && <Trophy className={classes.trophy} aria-hidden />}
              {match.games.map((game, i) => (
                <span key={i} className={classes.game}>
                  {game[side]}
                </span>
              ))}
            </span>
          </div>
        );
      })}
      {done && winner === null && (
        <Text size="sm" c="dimmed" ta="center">
          <Trans comment="A match that ended level">Draw</Trans>
        </Text>
      )}
      {onEdit &&
        (match.games.length > 0 ? (
          <Button
            variant="subtle"
            h={44}
            leftSection={<PencilSimple />}
            onClick={() => onEdit(match.id)}
            className={classes.action}
          >
            <Trans>Edit score</Trans>
          </Button>
        ) : (
          <Button size="lg" onClick={() => onEdit(match.id)} className={classes.action}>
            <Trans>Enter score</Trans>
          </Button>
        ))}
    </Paper>
  );
});
