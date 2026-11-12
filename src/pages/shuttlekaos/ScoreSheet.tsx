import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Stack, Text } from '@mantine/core';
import { useState, type FC } from 'react';

import { ResponsiveModal, Warning } from '~/components/ui';
import { gamesProblem } from '~/shuttlekaos/engine';
import { ScoreMode, type Game, type Match, type Settings } from '~/shuttlekaos/model';

import { GAMES_PROBLEMS, namesOf, type PlayerMap, playersOf } from './labels';
import { PlayerNames } from './People';
import { Stepper } from './Stepper';

import classes from './ScoreSheet.module.css';

type Draft = [number | null, number | null];
const EMPTY_GAME: Draft = [null, null];

const raceWinner = (points: number, [a, b]: Draft) => {
  if (a === points && b !== null && b < points) return 0;
  if (b === points && a !== null && a < points) return 1;
  return null;
};

const initialDraft = (settings: Settings, match: Match): Draft[] => {
  const slots = settings.scoreMode === ScoreMode.enum.race && settings.sets === 3 ? 3 : 1;
  return Array.from({ length: slots }, (_, i) => match.games[i] ?? EMPTY_GAME);
};

const visibleGames = (settings: Settings, draft: Draft[]) => {
  if (draft.length === 1) return 1;
  const [first = EMPTY_GAME, second = EMPTY_GAME] = draft;
  const a = raceWinner(settings.points, first);
  const b = raceWinner(settings.points, second);
  return a !== null && b !== null && a !== b ? 3 : 2;
};

const isGame = (game: Draft): game is Game => game[0] !== null && game[1] !== null;

type Props = {
  settings: Settings;
  match: Match;
  players: PlayerMap;
  onSave: (games: Game[]) => void;
  onClose: () => void;
};

export const ScoreSheet: FC<Props> = ({ settings, match, players, onSave, onClose }) => {
  const { t, i18n } = useLingui();
  const [draft, setDraft] = useState(() => initialDraft(settings, match));
  const shown = visibleGames(settings, draft);
  const games = draft.slice(0, shown).filter(isGame);
  const complete = games.length === shown;
  const problem = complete ? gamesProblem(settings, games) : null;
  const total = settings.scoreMode === ScoreMode.enum.total;
  const court = match.court;
  const sides = match.sides.map((ids) => playersOf(players, ids));

  const edit = (gameIndex: number, side: 0 | 1, value: number | null) =>
    setDraft((current) =>
      current.map((game, i): Draft => {
        if (i !== gameIndex) return game;
        const next: Draft = [...game];
        next[side] = value;
        const other = side === 0 ? 1 : 0;
        if (value !== null && total) next[other] = Math.max(0, settings.points - value);
        else if (value !== null && value < settings.points) next[other] = settings.points;
        return next;
      }),
    );

  const save = () => {
    if (!complete || problem) return;
    onSave(games);
  };

  return (
    <ResponsiveModal opened onClose={onClose} title={<Trans>Court {court}</Trans>}>
      <Stack gap="md">
        {total ? (
          <Text size="sm" c="dimmed">
            <Trans>Enter one side. The other fills in.</Trans>
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            <Trans>Enter the losing score. The winner gets the target.</Trans>
          </Text>
        )}
        {draft.slice(0, shown).map((game, gameIndex) => {
          const gameNumber = gameIndex + 1;
          return (
            <div key={gameIndex} className={classes.game}>
              {shown > 1 && (
                <Text fw={700} size="sm" className={classes.gameLabel}>
                  <Trans>Game {gameNumber}</Trans>
                </Text>
              )}
              {([0, 1] as const).map((side) => {
                const names = sides[side] ?? [];
                const sideName = namesOf(names);
                return (
                  <div key={side} className={classes.side}>
                    <PlayerNames players={names} stacked />
                    <Stepper
                      large
                      nullable
                      label={shown > 1 ? t`${sideName}, game ${gameNumber}` : sideName}
                      value={game[side]}
                      min={0}
                      max={settings.points}
                      onChange={(value) => edit(gameIndex, side, value)}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
        {problem && (
          <Text size="sm" className={classes.problem} role="alert">
            <Warning aria-hidden /> {i18n._(GAMES_PROBLEMS[problem])}
          </Text>
        )}
        <Button size="lg" fullWidth disabled={!complete || problem !== null} onClick={save}>
          <Trans>Save score</Trans>
        </Button>
        {match.games.length > 0 && (
          <Button variant="subtle" color="gray" fullWidth h={44} onClick={() => onSave([])}>
            <Trans>Clear score</Trans>
          </Button>
        )}
      </Stack>
    </ResponsiveModal>
  );
};
