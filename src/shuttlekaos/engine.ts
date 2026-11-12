import { roundsLeft } from './engine/coverage.ts';
import { isFixedPairs } from './engine/entrants.ts';
import { nextRound } from './engine/rounds.ts';
import { gamesProblem } from './engine/scores.ts';
import type { Game, Match, Pair, Player, Round, Session } from './model.ts';
import { MAX_PLAYERS, MAX_ROUNDS, PlayStyle, SessionStatus, Settings, SetupProblem } from './model.ts';

export type { Coverage } from './engine/coverage.ts';
export { pairCoverage, plannedRounds, roundsLeft } from './engine/coverage.ts';
export { gamesProblem, matchWinner, standings } from './engine/scores.ts';

const MAX_TITLE = 80;

const nameKey = (name: string): string => name.trim().toLocaleLowerCase();

export const entrantsNeeded = (settings: Settings): number => (settings.style === PlayStyle.enum.doubles ? 4 : 2);

const pairsComplete = (players: Player[], pairs: Pair[]): boolean => {
  const playerIds = new Set(players.map((player) => player.id));
  const paired = new Set(pairs.flat());
  return (
    pairs.length >= 2 &&
    paired.size === pairs.length * 2 &&
    paired.size === playerIds.size &&
    paired.isSubsetOf(playerIds)
  );
};

export const setupProblem = (settings: Settings, players: Player[], pairs: Pair[]): SetupProblem | null => {
  if (!Settings.safeParse(settings).success) return SetupProblem.enum.invalidSettings;
  if (players.length < entrantsNeeded(settings)) return SetupProblem.enum.tooFewPlayers;
  if (players.length > MAX_PLAYERS) return SetupProblem.enum.tooManyPlayers;
  const names = new Set(players.map((player) => nameKey(player.name)));
  const ids = new Set(players.map((player) => player.id));
  if (names.size !== players.length || ids.size !== players.length) return SetupProblem.enum.duplicateNames;
  if (isFixedPairs(settings) && !pairsComplete(players, pairs)) return SetupProblem.enum.pairsIncomplete;
  return null;
};

const lineup = (settings: Settings, players: Player[], pairs: Pair[]): Pick<Session, 'players' | 'pairs'> => ({
  players: players.map((player) => ({ ...player, name: player.name.trim() })),
  pairs: isFixedPairs(settings) ? pairs : [],
});

const isOpen = (session: Session): boolean => session.status === SessionStatus.enum.open;

export const createSession = (
  settings: Settings,
  players: Player[],
  pairs: Pair[],
  title: string,
  isPublic: boolean,
): Session => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    version: 1,
    revision: 0,
    title: title.trim().slice(0, MAX_TITLE),
    isPublic,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    finishedAt: null,
    status: SessionStatus.enum.open,
    settings,
    ...lineup(settings, players, pairs),
    rounds: [],
  };
};

export const startSession = (session: Session): Session => {
  if (!isOpen(session) || setupProblem(session.settings, session.players, session.pairs)) return session;
  const now = new Date().toISOString();
  return {
    ...session,
    status: SessionStatus.enum.running,
    startedAt: now,
    updatedAt: now,
    rounds: [nextRound(session)],
  };
};

export const setPlayers = (session: Session, players: Player[], pairs: Pair[]): Session => {
  if (!isOpen(session)) return session;
  return {
    ...session,
    ...lineup(session.settings, players, pairs),
    updatedAt: new Date().toISOString(),
  };
};

export const isRoundComplete = (session: Session, roundNumber: number): boolean => {
  const round = session.rounds.find((candidate) => candidate.number === roundNumber);
  return (
    round !== undefined &&
    round.matches.length > 0 &&
    round.matches.every((match) => gamesProblem(session.settings, match.games) === null)
  );
};

export const canAddRound = (session: Session): boolean => {
  const last = session.rounds.at(-1);
  return (
    session.status === SessionStatus.enum.running &&
    (roundsLeft(session) ?? MAX_ROUNDS - session.rounds.length) > 0 &&
    (last === undefined || isRoundComplete(session, last.number))
  );
};

export const addRound = (session: Session): Session => {
  if (!canAddRound(session)) return session;
  return { ...session, updatedAt: new Date().toISOString(), rounds: [...session.rounds, nextRound(session)] };
};

export const canUndoRound = (session: Session): boolean => {
  const last = session.rounds.at(-1);
  return (
    session.status === SessionStatus.enum.running &&
    session.rounds.length > 1 &&
    last?.matches.every((match) => match.games.length === 0) === true
  );
};

export const undoRound = (session: Session): Session => {
  if (!canUndoRound(session)) return session;
  return { ...session, updatedAt: new Date().toISOString(), rounds: session.rounds.slice(0, -1) };
};

export const setScore = (session: Session, matchId: string, games: Game[]): Session => {
  const hasMatch = (round: Round) => round.matches.some((match) => match.id === matchId);
  if (!session.rounds.some(hasMatch)) return session;
  const updateMatch = (match: Match): Match => (match.id === matchId ? { ...match, games } : match);
  return {
    ...session,
    updatedAt: new Date().toISOString(),
    rounds: session.rounds.map((round) =>
      hasMatch(round) ? { ...round, matches: round.matches.map(updateMatch) } : round,
    ),
  };
};

export const finishSession = (session: Session): Session => {
  if (session.status === SessionStatus.enum.finished) return session;
  const now = new Date().toISOString();
  return { ...session, status: SessionStatus.enum.finished, finishedAt: now, updatedAt: now };
};
