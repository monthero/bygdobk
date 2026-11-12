import { entrantsNeeded, plannedRounds } from '~/shuttlekaos/engine';
import { ScoreMode, type Pair, type Settings } from '~/shuttlekaos/model';

const MINUTES_PER_RALLY = 0.4;
const LOSER_SHARE = 0.7;
const GAMES_IN_BEST_OF_THREE = 2.4;
const CHANGEOVER_MINUTES = 2;

export type Estimate = { rounds: number | null; roundMinutes: number; totalMinutes: number | null };

const ralliesPerMatch = (settings: Settings) => {
  if (settings.scoreMode === ScoreMode.enum.total) return settings.points;
  const perGame = settings.points * (1 + LOSER_SHARE);
  return settings.sets === 3 ? perGame * GAMES_IN_BEST_OF_THREE : perGame;
};

const toNearestFive = (minutes: number) => Math.max(5, Math.round(minutes * 0.2) * 5);

export const estimate = (settings: Settings, playerCount: number, pairs: Pair[]): Estimate | null => {
  if (playerCount < entrantsNeeded(settings)) return null;
  const roundMinutes = ralliesPerMatch(settings) * MINUTES_PER_RALLY + CHANGEOVER_MINUTES;
  const rounds = plannedRounds(settings, playerCount, pairs);
  return {
    rounds,
    roundMinutes: Math.round(roundMinutes),
    totalMinutes: rounds === null ? null : toNearestFive(rounds * roundMinutes),
  };
};
