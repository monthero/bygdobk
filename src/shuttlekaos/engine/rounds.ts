import type { Match, Round, Session } from '../model.ts';
import { Format } from '../model.ts';
import type { Entrant } from './entrants.ts';
import { entrantsOf, entrantsPerMatch, sideIndexer } from './entrants.ts';
import { gamesProblem, pointTotals, standings } from './scores.ts';

// Tiers: new partners (singles and teams: new opponents until all have met) > balance > new opponents.
// A full rating gap of 2 costs 60, far below one partner repeat; a 0.05 gap already beats an opponent repeat.
const PARTNER_WEIGHT = 1000;
const BALANCE_WEIGHT = 30;
const OPPONENT_WEIGHT = 1;
// Below one repeat: a second rest in a row beats replaying the same pairing.
const BACK_TO_BACK_REST = 0.5;
const RESTARTS = 16;
const EPSILON = 1e-9;

type Contender = Entrant & {
  index: number;
  rests: number;
  lastRest: number;
  pointsFor: number;
  pointsAgainst: number;
  rating: number;
};

type PairTable = { get: (first: number, second: number) => number; add: (first: number, second: number) => void };

type History = { contenders: Contender[]; partners: PairTable; opponents: PairTable; opponentWeight: number };

const pairTable = (size: number): PairTable => {
  const cells = new Uint16Array(size * size);
  const get = (first: number, second: number) => cells[first * size + second] ?? 0;
  return {
    get,
    add: (first, second) => {
      const next = get(first, second) + 1;
      cells[first * size + second] = next;
      cells[second * size + first] = next;
    },
  };
};

const swap = (items: unknown[], first: number, second: number): void => {
  const a = items[first];
  const b = items[second];
  if (a === undefined || b === undefined) return;
  items[first] = b;
  items[second] = a;
};

const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    swap(copy, index, Math.floor(Math.random() * (index + 1)));
  }
  return copy;
};

const buildHistory = (session: Session): History => {
  const entrants = entrantsOf(session);
  const contenders = entrants.map((entrant, index): Contender => ({
    ...entrant,
    index,
    rests: 0,
    lastRest: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    rating: 0.5,
  }));
  const indexById = new Map(contenders.map((contender) => [contender.id, contender.index]));
  const toIndexes = sideIndexer(entrants, indexById);
  const partners = pairTable(contenders.length);
  const opponents = pairTable(contenders.length);
  let scoredMatches = 0;
  let scoredPoints = 0;
  const addPoints = (side: number[], pointsFor: number, pointsAgainst: number) => {
    for (const index of side) {
      const contender = contenders[index];
      if (!contender) continue;
      contender.pointsFor += pointsFor;
      contender.pointsAgainst += pointsAgainst;
    }
  };

  for (const round of session.rounds) {
    const playing = new Set<number>();
    for (const match of round.matches) {
      const home = toIndexes(match.sides[0]);
      const away = toIndexes(match.sides[1]);
      for (const side of [home, away]) {
        const [first, second] = side;
        if (first !== undefined && second !== undefined) partners.add(first, second);
        for (const index of side) playing.add(index);
      }
      for (const first of home) {
        for (const second of away) opponents.add(first, second);
      }
      if (gamesProblem(session.settings, match.games)) continue;
      const [homePoints, awayPoints] = pointTotals(match.games);
      scoredMatches += 1;
      scoredPoints += homePoints + awayPoints;
      addPoints(home, homePoints, awayPoints);
      addPoints(away, awayPoints, homePoints);
    }
    for (const contender of contenders) {
      if (playing.has(contender.index)) continue;
      contender.rests += 1;
      contender.lastRest = round.number;
    }
  }

  const prior = scoredMatches > 0 ? scoredPoints / scoredMatches : 0;
  for (const contender of contenders) {
    const played = contender.pointsFor + contender.pointsAgainst;
    if (played > 0) contender.rating = (contender.pointsFor + prior * 0.5) / (played + prior);
  }

  const { settings } = session;
  const unmetLeft = contenders.some((first) =>
    contenders.some((second) => first.index < second.index && opponents.get(first.index, second.index) === 0),
  );
  const opponentsAreCoverage =
    settings.format === Format.enum.americano && entrantsPerMatch(settings) === 2 && unmetLeft;
  return {
    contenders,
    partners,
    opponents,
    opponentWeight: opponentsAreCoverage ? PARTNER_WEIGHT : OPPONENT_WEIGHT,
  };
};

const sideCost = ({ partners }: History, side: Contender[]): number => {
  const [first, second] = side;
  if (!first || !second) return 0;
  return PARTNER_WEIGHT * partners.get(first.index, second.index);
};

const ratingSum = (side: Contender[]): number => side.reduce((sum, contender) => sum + contender.rating, 0);

const matchCost = (history: History, group: Contender[]): number => {
  const half = group.length / 2;
  const home = group.slice(0, half);
  const away = group.slice(half);
  let cost = sideCost(history, home) + sideCost(history, away);
  cost += BALANCE_WEIGHT * Math.abs(ratingSum(home) - ratingSum(away));
  for (const first of home) {
    for (const second of away) cost += history.opponentWeight * history.opponents.get(first.index, second.index);
  }
  return cost;
};

type Bench = { start: number; canSwap: (contender: Contender) => boolean; cost: (contender: Contender) => number };

const benchCost = (slots: Contender[], bench: Bench): number =>
  slots.slice(bench.start).reduce((sum, contender) => sum + bench.cost(contender), 0);

const climb = (
  history: History,
  start: Contender[],
  perMatch: number,
  bench: Bench,
): { slots: Contender[]; cost: number } => {
  const slots = [...start];
  const groupOf = (match: number) => slots.slice(match * perMatch, (match + 1) * perMatch);
  const costs = Array.from({ length: bench.start / perMatch }, (_, match) => matchCost(history, groupOf(match)));
  const half = perMatch / 2;
  let improved = true;
  while (improved) {
    improved = false;
    for (let first = 0; first < bench.start; first += 1) {
      const firstMatch = Math.floor(first / perMatch);
      for (let second = first + 1; second < slots.length; second += 1) {
        const playing = slots[first];
        const resting = slots[second];
        if (!playing || !resting) continue;
        if (second >= bench.start) {
          if (!bench.canSwap(playing) || !bench.canSwap(resting)) continue;
          const before = (costs[firstMatch] ?? 0) + bench.cost(resting);
          swap(slots, first, second);
          const firstCost = matchCost(history, groupOf(firstMatch));
          if (firstCost + bench.cost(playing) < before - EPSILON) {
            costs[firstMatch] = firstCost;
            improved = true;
          } else {
            swap(slots, first, second);
          }
          continue;
        }
        const secondMatch = Math.floor(second / perMatch);
        if (Math.floor(first / half) === Math.floor(second / half)) continue;
        const before = (costs[firstMatch] ?? 0) + (firstMatch === secondMatch ? 0 : (costs[secondMatch] ?? 0));
        swap(slots, first, second);
        const firstCost = matchCost(history, groupOf(firstMatch));
        const secondCost = firstMatch === secondMatch ? 0 : matchCost(history, groupOf(secondMatch));
        if (firstCost + secondCost < before - EPSILON) {
          costs[firstMatch] = firstCost;
          if (firstMatch !== secondMatch) costs[secondMatch] = secondCost;
          improved = true;
        } else {
          swap(slots, first, second);
        }
      }
    }
  }
  return { slots, cost: costs.reduce((sum, cost) => sum + cost, 0) + benchCost(slots, bench) };
};

const americanoSlots = (history: History, queue: Contender[], restCount: number, perMatch: number): Contender[] => {
  const boundary = queue.at(restCount - 1)?.rests;
  const lastRound = Math.max(0, ...queue.map((contender) => contender.lastRest));
  const bench: Bench = {
    start: queue.length - restCount,
    canSwap: (contender) => restCount > 0 && contender.rests === boundary,
    cost: (contender) => (lastRound > 0 && contender.lastRest === lastRound ? BACK_TO_BACK_REST : 0),
  };
  const resting = queue.slice(0, restCount);
  const playing = queue.slice(restCount);
  const attempt = () => climb(history, [...shuffle(playing), ...resting], perMatch, bench);
  let best = attempt();
  for (let round = 1; round < RESTARTS && best.cost > 0; round += 1) {
    const candidate = attempt();
    if (candidate.cost < best.cost) best = candidate;
  }
  return best.slots;
};

const mexicanoSlots = (session: Session, history: History, active: Contender[], perMatch: number): Contender[] => {
  const ranks = new Map(standings(session).map((standing) => [standing.entrantId, standing.rank]));
  const rankOf = (contender: Contender) => ranks.get(contender.id) ?? Number.POSITIVE_INFINITY;
  const ordered = shuffle(active).sort((first, second) => rankOf(first) - rankOf(second));
  if (perMatch === 2) return ordered;
  return Array.from({ length: ordered.length / 4 }, (_, group) => ordered.slice(group * 4, group * 4 + 4)).flatMap(
    ([first, second, third, fourth]) => {
      if (!first || !second || !third || !fourth) return [];
      const standard = [first, third, second, fourth];
      const fallback = [first, fourth, second, third];
      const repeats = (slots: Contender[]) => sideCost(history, slots.slice(0, 2)) + sideCost(history, slots.slice(2));
      return repeats(fallback) < repeats(standard) ? fallback : standard;
    },
  );
};

const arrange = (session: Session, history: History, queue: Contender[], restCount: number, perMatch: number) => {
  if (session.settings.format === Format.enum.americano) return americanoSlots(history, queue, restCount, perMatch);
  const playing = queue.slice(restCount);
  const resting = queue.slice(0, restCount);
  if (session.rounds.length === 0) return [...shuffle(playing), ...resting];
  return [...mexicanoSlots(session, history, playing, perMatch), ...resting];
};

export const nextRound = (session: Session): Round => {
  const history = buildHistory(session);
  const { contenders } = history;
  const perMatch = entrantsPerMatch(session.settings);
  const matchCount = Math.min(session.settings.courts, Math.floor(contenders.length / perMatch));
  const restCount = contenders.length - matchCount * perMatch;
  const queue = shuffle(contenders).sort(
    (first, second) => first.rests - second.rests || first.lastRest - second.lastRest,
  );
  const slots = arrange(session, history, queue, restCount, perMatch);
  const resting = slots.slice(slots.length - restCount);
  const number = (session.rounds.at(-1)?.number ?? 0) + 1;
  const half = perMatch / 2;

  const matches = Array.from({ length: matchCount }, (_, match): Match => {
    const group = slots.slice(match * perMatch, (match + 1) * perMatch);
    return {
      id: `r${number}c${match + 1}`,
      court: match + 1,
      sides: [
        group.slice(0, half).flatMap((entrant) => entrant.playerIds),
        group.slice(half).flatMap((entrant) => entrant.playerIds),
      ],
      games: [],
    };
  });

  return {
    number,
    matches,
    resting: resting.sort((first, second) => first.index - second.index).flatMap((entrant) => entrant.playerIds),
  };
};
