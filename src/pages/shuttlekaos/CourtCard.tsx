import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Paper, Text } from '@mantine/core';
import { memo, useState } from 'react';

import { CheckCircle, PencilSimple, Trophy, Warning } from '~/components/ui';
import { gamesProblem, matchWinner } from '~/shuttlekaos/engine';
import { ScoreMode, type Game, type Match, type Settings } from '~/shuttlekaos/model';

import { GAMES_PROBLEMS, namesOf, playersOf, type PlayerMap } from './labels';
import { PlayerNames } from './People';
import { ScoreBox } from './ScoreBox';

import classes from './CourtCard.module.css';

type Draft = [number | null, number | null];
const EMPTY_DRAFT: Draft = [null, null];

const draftOf = (match: Match): Draft => match.games.at(0) ?? EMPTY_DRAFT;

const fillOther = (settings: Settings, draft: Draft, side: 0 | 1, value: number | null): Draft => {
  const next: Draft = [...draft];
  next[side] = value;
  const other = side === 0 ? 1 : 0;
  if (value === null) return next;
  if (settings.scoreMode === ScoreMode.enum.total) next[other] = Math.max(0, settings.points - value);
  else if (value < settings.points) next[other] = settings.points;
  return next;
};

const isGame = (draft: Draft): draft is Game => draft[0] !== null && draft[1] !== null;

type Props = {
  match: Match;
  settings: Settings;
  players: PlayerMap;
  onScore?: (matchId: string, games: Game[]) => void;
  onEdit?: (matchId: string) => void;
};

export const CourtCard = memo<Props>(({ match, settings, players, onScore, onEdit }) => {
  const { t, i18n } = useLingui();
  const done = gamesProblem(settings, match.games) === null;
  const winner = done ? matchWinner(settings, match) : null;
  const court = match.court;
  const inline = settings.scoreMode === ScoreMode.enum.total || settings.sets === 1;
  const [saved, setSaved] = useState(match.games);
  const [draft, setDraft] = useState(() => draftOf(match));
  if (saved !== match.games) {
    setSaved(match.games);
    setDraft(draftOf(match));
  }
  const sides = match.sides.map((ids) => playersOf(players, ids));
  const draftProblem = isGame(draft) && !done ? gamesProblem(settings, [draft]) : null;

  const pick = (side: 0 | 1, value: number | null) => {
    if (!onScore) return;
    if (value === null) {
      setDraft(EMPTY_DRAFT);
      if (match.games.length > 0) onScore(match.id, []);
      return;
    }
    const next = fillOther(settings, draft, side, value);
    setDraft(next);
    if (isGame(next) && gamesProblem(settings, [next]) === null) onScore(match.id, [next]);
  };

  const status = done ? (
    <Badge color="teal" variant="light" leftSection={<CheckCircle />}>
      <Trans comment="A court whose score is entered">Done</Trans>
    </Badge>
  ) : (
    <Badge color="brand" variant="light">
      <Trans comment="A court still playing, no score yet">Playing</Trans>
    </Badge>
  );

  if (inline) {
    const [home = [], away = []] = sides;
    const homeName = namesOf(home);
    const awayName = namesOf(away);
    return (
      <Paper withBorder radius="lg" className={classes.card} data-done={done || undefined}>
        <div className={classes.head}>
          <Text fw={700} className={classes.court}>
            <Trans>Court {court}</Trans>
          </Text>
          {status}
        </div>
        <div className={classes.duel}>
          <div className={classes.duelSide} data-won={winner === 0 || undefined} data-lost={winner === 1 || undefined}>
            <PlayerNames players={home} size={26} stacked />
          </div>
          <div className={classes.boxes}>
            <ScoreBox
              label={t`Score for ${homeName}`}
              value={draft[0]}
              max={settings.points}
              won={winner === 0}
              onPick={onScore && ((value) => pick(0, value))}
            />
            <span className={classes.dash} aria-hidden>
              –
            </span>
            <ScoreBox
              label={t`Score for ${awayName}`}
              value={draft[1]}
              max={settings.points}
              won={winner === 1}
              onPick={onScore && ((value) => pick(1, value))}
            />
          </div>
          <div className={classes.duelSide} data-won={winner === 1 || undefined} data-lost={winner === 0 || undefined}>
            <PlayerNames players={away} size={26} stacked end />
          </div>
        </div>
        {draftProblem && (
          <Text size="sm" className={classes.problem} role="alert">
            <Warning aria-hidden /> {i18n._(GAMES_PROBLEMS[draftProblem])}
          </Text>
        )}
        {done && winner === null && (
          <Text size="sm" c="dimmed" ta="center">
            <Trans comment="A match that ended level">Draw</Trans>
          </Text>
        )}
      </Paper>
    );
  }

  return (
    <Paper withBorder radius="lg" className={classes.card} data-done={done || undefined}>
      <div className={classes.head}>
        <Text fw={700} className={classes.court}>
          <Trans>Court {court}</Trans>
        </Text>
        {status}
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
