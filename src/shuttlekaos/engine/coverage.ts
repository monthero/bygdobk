import type { Pair, Session, Settings } from '../model.ts';
import { EVERYONE_ONCE, Format, MAX_ROUNDS, SessionStatus } from '../model.ts';
import { entrantsOf, entrantsPerMatch, isFixedPairs, sideIndexer } from './entrants.ts';

export type Coverage = { covered: number; total: number };

const pairTotal = (entrantCount: number): number => (entrantCount * (entrantCount - 1)) / 2;

const pairsPerRound = (settings: Settings, entrantCount: number): number => {
  const perMatch = entrantsPerMatch(settings);
  const matches = Math.min(settings.courts, Math.floor(entrantCount / perMatch));
  return perMatch === 4 ? matches * 2 : matches;
};

export const plannedRounds = (settings: Settings, playerCount: number, pairs: Pair[] = []): number | null => {
  if (settings.rounds !== EVERYONE_ONCE) return settings.rounds;
  let entrantCount = playerCount;
  if (isFixedPairs(settings)) entrantCount = pairs.length > 0 ? pairs.length : Math.floor(playerCount / 2);
  const perRound = pairsPerRound(settings, entrantCount);
  if (perRound === 0) return 0;
  return Math.min(MAX_ROUNDS, Math.ceil(pairTotal(entrantCount) / perRound));
};

export const pairCoverage = (session: Session): Coverage => {
  const entrants = entrantsOf(session);
  const indexById = new Map(entrants.map((entrant, index) => [entrant.id, index]));
  const toIndexes = sideIndexer(entrants, indexById);
  const rotating = entrantsPerMatch(session.settings) === 4;
  const covered = new Set<number>();
  const cover = (first: number, second: number) =>
    covered.add(Math.min(first, second) * entrants.length + Math.max(first, second));

  for (const match of session.rounds.flatMap((round) => round.matches)) {
    const home = toIndexes(match.sides[0]);
    const away = toIndexes(match.sides[1]);
    if (rotating) {
      for (const [first, second] of [home, away]) {
        if (first !== undefined && second !== undefined) cover(first, second);
      }
      continue;
    }
    for (const first of home) {
      for (const second of away) cover(first, second);
    }
  }
  return { covered: covered.size, total: pairTotal(entrants.length) };
};

export const roundsLeft = (session: Session): number | null => {
  const { settings } = session;
  if (session.status === SessionStatus.enum.finished) return 0;
  const planned = plannedRounds(settings, session.players.length, session.pairs);
  if (planned === null) return null;
  const played = session.rounds.length;
  if (settings.rounds !== EVERYONE_ONCE || settings.format === Format.enum.mexicano) {
    return Math.max(0, planned - played);
  }
  const { covered, total } = pairCoverage(session);
  if (covered >= total) return 0;
  const perRound = pairsPerRound(settings, entrantsOf(session).length);
  return Math.max(0, Math.min(MAX_ROUNDS - played, Math.ceil((total - covered) / perRound)));
};
