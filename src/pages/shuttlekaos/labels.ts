import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { clamp } from '@mantine/hooks';
import { z } from 'zod';

import { currentLocale, listFormat } from '~/i18n/current';
import { withLocale } from '~/i18n/locales';
import { entrantsNeeded, finishSession, standings } from '~/shuttlekaos/engine';
import {
  Format,
  GamesProblem,
  Level,
  Partners,
  PlayStyle,
  ScoreMode,
  SessionStatus,
  SetupProblem,
  MAX_COURTS,
  type Player,
  type Session,
  type Settings,
} from '~/shuttlekaos/model';
import { isStale, SESSION_IDLE_MINUTES } from '~/shuttlekaos/store';
import { dayjs } from '~/utils/dates';

export const BRAND = 'ShuttleKaos';

export const TAGLINE = msg`Controlled chaos on court`;

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

export type PlayerMap = ReadonlyMap<string, Player>;

export const playerMap = (players: Player[]): PlayerMap => new Map(players.map((p) => [p.id, p]));

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

export const namesOf = (players: Pick<Player, 'name'>[]) => listFormat().format(players.map((p) => p.name));
