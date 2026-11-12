import type { Game, Match, Session, Settings, Standing } from '../model.ts';
import { GamesProblem, ScoreMode } from '../model.ts';
import { entrantsOf, sideResolver } from './entrants.ts';

type Tally = Omit<Standing, 'rank'>;

const raceGameProblem = (points: number, [home, away]: Game): GamesProblem | null => {
  if (home > points || away > points) return GamesProblem.enum.overTarget;
  if (home === points && away === points) return GamesProblem.enum.bothReachedTarget;
  if (home !== points && away !== points) return GamesProblem.enum.targetNotReached;
  return null;
};

export const gamesProblem = (settings: Settings, games: Game[]): GamesProblem | null => {
  if (settings.scoreMode === ScoreMode.enum.total) {
    const game = games.at(0);
    if (games.length !== 1 || !game) return GamesProblem.enum.wrongGameCount;
    return game[0] + game[1] === settings.points ? null : GamesProblem.enum.totalMismatch;
  }
  const needed = settings.sets === 3 ? 2 : 1;
  const wins: [number, number] = [0, 0];
  for (const game of games) {
    if (Math.max(...wins) === needed) return GamesProblem.enum.alreadyDecided;
    const problem = raceGameProblem(settings.points, game);
    if (problem) return problem;
    wins[game[0] > game[1] ? 0 : 1] += 1;
  }
  return Math.max(...wins) === needed ? null : GamesProblem.enum.wrongGameCount;
};

const gameWins = (games: Game[]): Game => [
  games.filter(([home, away]) => home > away).length,
  games.filter(([home, away]) => away > home).length,
];

export const pointTotals = (games: Game[]): Game =>
  games.reduce<Game>(([home, away], game) => [home + game[0], away + game[1]], [0, 0]);

export const matchWinner = (settings: Settings, match: Match): 0 | 1 | null => {
  if (gamesProblem(settings, match.games)) return null;
  const [home, away] = gameWins(match.games);
  if (home === away) return null;
  return home > away ? 0 : 1;
};

const rankKey = (settings: Settings, tally: Tally): number[] => {
  const pointDiff = tally.pointsFor - tally.pointsAgainst;
  if (settings.scoreMode === ScoreMode.enum.total) return [tally.pointsFor, tally.won, pointDiff];
  return [tally.won, tally.setsWon - tally.setsLost, pointDiff];
};

const compareKeys = (first: number[], second: number[]): number => {
  for (const [index, value] of first.entries()) {
    const diff = (second[index] ?? 0) - value;
    if (diff !== 0) return diff;
  }
  return 0;
};

export const standings = (session: Session): Standing[] => {
  const { settings } = session;
  const entrants = entrantsOf(session);
  const resolveSide = sideResolver(entrants);
  const tallies = new Map(
    entrants.map((entrant): [string, Tally] => [
      entrant.id,
      {
        entrantId: entrant.id,
        playerIds: entrant.playerIds,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        setsWon: 0,
        setsLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      },
    ]),
  );

  for (const match of session.rounds.flatMap((round) => round.matches)) {
    if (gamesProblem(settings, match.games)) continue;
    const winner = matchWinner(settings, match);
    const sets = gameWins(match.games);
    const points = pointTotals(match.games);
    for (const side of [0, 1] as const) {
      const other = side === 0 ? 1 : 0;
      for (const id of resolveSide(match.sides[side])) {
        const tally = tallies.get(id);
        if (!tally) continue;
        tally.played += 1;
        if (winner === null) tally.drawn += 1;
        else if (winner === side) tally.won += 1;
        else tally.lost += 1;
        tally.setsWon += sets[side];
        tally.setsLost += sets[other];
        tally.pointsFor += points[side];
        tally.pointsAgainst += points[other];
      }
    }
  }

  const sorted = Array.from(tallies.values(), (tally) => ({ tally, key: rankKey(settings, tally) })).sort(
    (first, second) => compareKeys(first.key, second.key),
  );
  const result: Standing[] = [];
  let previous: { key: number[]; rank: number } | undefined;
  for (const [index, { tally, key }] of sorted.entries()) {
    const rank = previous && compareKeys(previous.key, key) === 0 ? previous.rank : index + 1;
    result.push({ ...tally, rank });
    previous = { key, rank };
  }
  return result;
};
