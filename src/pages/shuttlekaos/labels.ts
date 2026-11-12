import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { clamp } from '@mantine/hooks';
import type { MouseEvent } from 'react';
import { z } from 'zod';

import { currentLocale, listFormat, numberFormat, unitListFormat } from '~/i18n/current';
import { withLocale } from '~/i18n/locales';
import { entrantsNeeded, finishSession, gamesProblem, matchWinner, standings } from '~/shuttlekaos/engine';
import {
  EVERYONE_ONCE,
  Format,
  GamesProblem,
  Level,
  Partners,
  PlayStyle,
  ScoreMode,
  SessionStatus,
  SetupProblem,
  MAX_COURTS,
  type Match,
  type Player,
  type Round,
  type Session,
  type SessionSummary,
  type Settings,
} from '~/shuttlekaos/model';
import { isStale, SESSION_IDLE_MINUTES } from '~/shuttlekaos/store';
import { CLOCK, dayjs, formatDate, today, wallTime } from '~/utils/dates';

export const BRAND = 'ShuttleKaos';

export const TABLE_QUERY = '(min-width: 62em)';

export const stop = (event: MouseEvent) => event.stopPropagation();

export const TAGLINE = msg`Unleash chaos on court`;

export const FORMAT_LABELS: Record<Format, { label: MessageDescriptor; hint: MessageDescriptor }> = {
  [Format.enum.americano]: {
    label: msg({ message: 'Americano', comment: 'Name of a social game format from padel. Usually not translated' }),
    hint: msg`A set rotation. You play with and against as many people as possible.`,
  },
  [Format.enum.mexicano]: {
    label: msg({ message: 'Mexicano', comment: 'Name of a social game format from padel. Usually not translated' }),
    hint: msg`Each round matches players with similar scores. Games get closer as you go.`,
  },
};

export const STYLE_LABELS: Record<PlayStyle, MessageDescriptor> = {
  [PlayStyle.enum.singles]: msg({ message: 'Singles', comment: 'Badminton: one player on each side' }),
  [PlayStyle.enum.doubles]: msg({ message: 'Doubles', comment: 'Badminton: two players on each side' }),
};

export const PARTNER_LABELS: Record<Partners, MessageDescriptor> = {
  [Partners.enum.rotating]: msg({ message: 'Rotating', comment: 'Doubles partners: a new partner every round' }),
  [Partners.enum.fixed]: msg({ message: 'Fixed', comment: 'Doubles partners: the same partner all session' }),
};

export const PARTNER_HINTS: Record<Partners, MessageDescriptor> = {
  [Partners.enum.rotating]: msg`New partner every round.`,
  [Partners.enum.fixed]: msg`Same partner all session.`,
};

export const SCORE_MODE_LABELS: Record<
  ScoreMode,
  { label: MessageDescriptor; short: MessageDescriptor; hint: MessageDescriptor }
> = {
  [ScoreMode.enum.total]: {
    label: msg`Total points per match`,
    short: msg({ message: 'Total points', comment: 'Short scoring option: a fixed number of points per match' }),
    hint: msg`Play a set number of rallies. Every point counts.`,
  },
  [ScoreMode.enum.race]: {
    label: msg`First to X points`,
    short: msg({ message: 'First to X', comment: 'Short scoring option: first side to reach the target wins' }),
    hint: msg`Classic games. The first side to reach the target wins.`,
  },
};

export const LEVEL_HINTS: Record<Level, MessageDescriptor> = {
  [Level.enum.E]: msg({
    message: 'Elite. 500+ ranking points, the top of Norway.',
    comment: 'Badminton level E, from NBF ranking points',
  }),
  [Level.enum.A]: msg({
    message: '150–499 points. Strong tournament players.',
    comment: 'Badminton level A, from NBF ranking points',
  }),
  [Level.enum.B]: msg({
    message: '50–149 points. Regular tournament players.',
    comment: 'Badminton level B, from NBF ranking points',
  }),
  [Level.enum.C]: msg({
    message: '20–49 points. Club players with some tournaments behind them.',
    comment: 'Badminton level C, from NBF ranking points',
  }),
  [Level.enum.D]: msg({
    message: '0–19 points. Beginners, casual players and anyone without points.',
    comment: 'Badminton level D, from NBF ranking points',
  }),
};

export const Visibility = z.enum(['public', 'private']);
export type Visibility = z.infer<typeof Visibility>;

export const VISIBILITY_LABELS: Record<Visibility, { label: MessageDescriptor; hint: MessageDescriptor }> = {
  [Visibility.enum.public]: {
    label: msg({ message: 'Public', comment: 'Session visibility' }),
    hint: msg`Listed for everyone. Anyone with an account can join.`,
  },
  [Visibility.enum.private]: {
    label: msg({ message: 'Private', comment: 'Session visibility' }),
    hint: msg`Only people with the link can see and join.`,
  },
};

export const SETUP_PROBLEMS: Record<SetupProblem, MessageDescriptor> = {
  [SetupProblem.enum.tooFewPlayers]: msg({ message: 'Add at least {min} players.', comment: 'min is a number' }),
  [SetupProblem.enum.tooManyPlayers]: msg`That's more players than we can handle. Remove a few.`,
  [SetupProblem.enum.duplicateNames]: msg`Two players have the same name. Make them different.`,
  [SetupProblem.enum.pairsIncomplete]: msg`Put every player in a pair.`,
  [SetupProblem.enum.invalidSettings]: msg`Some settings don't add up. Check them again.`,
};

export const GAMES_PROBLEMS: Record<GamesProblem, MessageDescriptor> = {
  [GamesProblem.enum.wrongGameCount]: msg`Enter a score for every game.`,
  [GamesProblem.enum.totalMismatch]: msg`The points don't add up to the match total.`,
  [GamesProblem.enum.targetNotReached]: msg`One side needs to reach the target.`,
  [GamesProblem.enum.overTarget]: msg`A score can't go past the target.`,
  [GamesProblem.enum.bothReachedTarget]: msg`Only one side can reach the target.`,
  [GamesProblem.enum.alreadyDecided]: msg`The match was already won. Drop the last game.`,
};

export type ShownPlayer = Player & { realName?: string };
export type PlayerMap = ReadonlyMap<string, ShownPlayer>;

export const YOU = msg({ message: 'You', comment: 'Shown instead of your own name in a session' });

export const asMe = (player: Player, you: string): ShownPlayer => ({ ...player, name: you, realName: player.name });

export const isMe = (player: Pick<ShownPlayer, 'realName'>) => player.realName !== undefined;

export const playerMap = (players: Player[], myId: string | null, you: string): PlayerMap =>
  new Map(players.map((p) => [p.id, p.id === myId ? asMe(p, you) : p]));

export const playersOf = (players: PlayerMap, ids: string[]) =>
  ids.flatMap((id) => {
    const player = players.get(id);
    return player ? [player] : [];
  });

export const endedAutomatically = (session: Session) =>
  isStale(session) ||
  (session.status === SessionStatus.enum.finished &&
    session.finishedAt !== null &&
    dayjs(session.updatedAt).diff(session.finishedAt, 'minute') >= SESSION_IDLE_MINUTES);

export const autoFinish = (session: Session): Session => ({
  ...finishSession(session),
  finishedAt: session.updatedAt,
});

export const shownSession = (session: Session, finishedOnServer = false) =>
  session.status === SessionStatus.enum.running && (finishedOnServer || isStale(session))
    ? autoFinish(session)
    : session;

export const resume = (session: Session): Session => ({
  ...session,
  status: SessionStatus.enum.running,
  finishedAt: null,
  updatedAt: new Date().toISOString(),
});

export const sessionUrl = (code: string) =>
  `${window.location.origin}${withLocale(`/shuttlekaos/${encodeURIComponent(code)}`, currentLocale())}`;

export const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

export const unlinkPlayers = (players: Player[], names: string[]) =>
  players.map((p) =>
    p.profileId && names.some((name) => sameName(name, p.name)) ? { ...p, profileId: null, avatarUrl: null } : p,
  );

export const standingsUpTo = (session: Session, roundNumber: number) =>
  standings({ ...session, rounds: session.rounds.filter((r) => r.number <= roundNumber) });

export const rankMoves = (session: Session, roundNumber: number): ReadonlyMap<string, number> => {
  if (roundNumber <= 1) return new Map();
  const before = new Map(standingsUpTo(session, roundNumber - 1).map((s) => [s.entrantId, s.rank]));
  return new Map(
    standingsUpTo(session, roundNumber).map((s) => [s.entrantId, (before.get(s.entrantId) ?? s.rank) - s.rank]),
  );
};

export const suggestedCourts = (settings: Settings, playerCount: number) =>
  clamp(Math.floor(playerCount / entrantsNeeded(settings)), 1, MAX_COURTS);

export const namesOf = (players: Pick<ShownPlayer, 'name' | 'realName'>[]) =>
  listFormat().format(players.toSorted((a, b) => Number(isMe(b)) - Number(isMe(a))).map((p) => p.name));

export const DEFAULT_POINTS: Record<ScoreMode, number> = {
  [ScoreMode.enum.total]: 21,
  [ScoreMode.enum.race]: 15,
};

export const RoundsChoice = z.enum(['everyone', 'count', 'open']);
export type RoundsChoice = z.infer<typeof RoundsChoice>;

export const roundsChoice = (rounds: Settings['rounds']): RoundsChoice => {
  if (rounds === EVERYONE_ONCE) return RoundsChoice.enum.everyone;
  return rounds === null ? RoundsChoice.enum.open : RoundsChoice.enum.count;
};

export const SectionColor = z.enum(['brand', 'teal', 'blue', 'grape']);
export type SectionColor = z.infer<typeof SectionColor>;

export const MatchResult = z.enum(['win', 'draw', 'loss']);
export type MatchResult = z.infer<typeof MatchResult>;

export type Form = {
  played: number;
  average: number;
  last: MatchResult[];
};

const FORM_LENGTH = 5;

export const formOf = (session: Session, playerIds: string[]): Form => {
  const key = playerIds.at(0);
  const results: MatchResult[] = [];
  let points = 0;
  for (const match of session.rounds.flatMap((r) => r.matches)) {
    const side = match.sides.findIndex((ids) => key !== undefined && ids.includes(key));
    if (side < 0 || gamesProblem(session.settings, match.games) !== null) continue;
    const winner = matchWinner(session.settings, match);
    if (winner === null) results.push(MatchResult.enum.draw);
    else results.push(winner === side ? MatchResult.enum.win : MatchResult.enum.loss);
    points += match.games.reduce((sum, game) => sum + (game[side] ?? 0), 0);
  }
  return {
    played: results.length,
    average: results.length > 0 ? points / results.length : 0,
    last: results.slice(-FORM_LENGTH),
  };
};

export const TableVariant = z.enum(['compact', 'full', 'final']);
export type TableVariant = z.infer<typeof TableVariant>;

const MINUTES_PER_HOUR = 60;

export const minutesText = (minutes: number) =>
  numberFormat({ style: 'unit', unit: 'minute', unitDisplay: 'short' }).format(minutes);

export const durationText = (minutes: number) => {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === 0) return minutesText(rest);
  const hoursText = numberFormat({ style: 'unit', unit: 'hour', unitDisplay: 'short' }).format(hours);
  return rest === 0 ? hoursText : unitListFormat().format([hoursText, minutesText(rest)]);
};

export const SummaryPart = z.enum(['format', 'play', 'courts', 'scoring', 'rounds', 'levels', 'visibility']);
export type SummaryPart = z.infer<typeof SummaryPart>;

export const matchMinutes = (round: Round, match: Match): number | null =>
  round.startedAt && match.endedAt ? Math.max(1, dayjs(match.endedAt).diff(round.startedAt, 'minute')) : null;

const START: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', ...CLOCK };
const START_OTHER_YEAR: Intl.DateTimeFormatOptions = { ...START, year: 'numeric' };

export const formatStart = (iso: string) => {
  const start = wallTime(iso);
  return formatDate(start, start.isSame(today(), 'year') ? START : START_OTHER_YEAR);
};

export const sessionMinutes = ({ startedAt, finishedAt }: Pick<SessionSummary, 'startedAt' | 'finishedAt'>) =>
  startedAt && finishedAt ? dayjs(finishedAt).diff(startedAt, 'minute') : null;
