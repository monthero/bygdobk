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
  Repeat,
  ScoreMode,
  SessionStatus,
  SetupProblem,
  MAX_COURTS,
  MAX_PLAYERS,
  MIN_PLAYER_LIMIT,
  type Match,
  type Player,
  type Round,
  type SeriesInfo,
  type Session,
  type SessionSummary,
  type Settings,
  type WeeksBetween,
} from '~/shuttlekaos/model';
import { MatchResult } from '~/shuttlekaos/queries';
import { canSchedule, isStale, MAX_DAYS_AHEAD, SESSION_IDLE_MINUTES, type SeriesPlan } from '~/shuttlekaos/store';
import {
  CLOCK,
  date,
  dayjs,
  formatDate,
  fromWall,
  ISO_DAY,
  SHORT_DATE,
  today,
  wallTime,
  weekdayName,
} from '~/utils/dates';

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

export const firstName = (name: string) => name.trim().split(' ').at(0) ?? name;

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

export const suggestedLimit = (settings: Settings, playerCount: number) =>
  clamp(Math.max(playerCount, settings.courts * entrantsNeeded(settings)), MIN_PLAYER_LIMIT, MAX_PLAYERS);

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

export const RESULT_LABELS: Record<MatchResult, { label: MessageDescriptor; short: MessageDescriptor }> = {
  [MatchResult.enum.won]: {
    label: msg`Won`,
    short: msg({ message: 'W', comment: 'Short for won: a column heading or a match result' }),
  },
  [MatchResult.enum.drawn]: {
    label: msg`Drawn`,
    short: msg({ message: 'D', comment: 'Short for drawn: a column heading or a match result' }),
  },
  [MatchResult.enum.lost]: {
    label: msg`Lost`,
    short: msg({ message: 'L', comment: 'Short for lost: a column heading or a match result' }),
  },
};

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
    if (winner === null) results.push(MatchResult.enum.drawn);
    else results.push(winner === side ? MatchResult.enum.won : MatchResult.enum.lost);
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

const KM_DECIMALS_BELOW = 10;

export const distanceText = (km: number) =>
  numberFormat({
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'short',
    maximumFractionDigits: km < KM_DECIMALS_BELOW ? 1 : 0,
  }).format(km);

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

const SCHEDULED: Intl.DateTimeFormatOptions = { weekday: 'short', ...START };
const SCHEDULED_OTHER_YEAR: Intl.DateTimeFormatOptions = { ...SCHEDULED, year: 'numeric' };

const formatWall = (iso: string, thisYear: Intl.DateTimeFormatOptions, otherYear: Intl.DateTimeFormatOptions) => {
  const at = wallTime(iso);
  return formatDate(at, at.isSame(today(), 'year') ? thisYear : otherYear);
};

export const formatStart = (iso: string) => formatWall(iso, START, START_OTHER_YEAR);

export const formatScheduled = (iso: string) => formatWall(iso, SCHEDULED, SCHEDULED_OTHER_YEAR);

export const sessionTimeText = ({ startedAt, scheduledAt }: Pick<SessionSummary, 'startedAt' | 'scheduledAt'>) => {
  if (startedAt) return formatStart(startedAt);
  if (scheduledAt) return formatScheduled(scheduledAt);
  return null;
};

const START_CUE_MINUTES = 10;

export const startCueAt = (scheduledAt: string) =>
  dayjs(scheduledAt).subtract(START_CUE_MINUTES, 'minute').toISOString();

export const REPEAT_WEEKS: Record<Repeat, WeeksBetween | null> = {
  [Repeat.enum.none]: null,
  [Repeat.enum.weekly]: 1,
  [Repeat.enum.biweekly]: 2,
};

const REPEATS: Record<WeeksBetween, { open: MessageDescriptor; until: MessageDescriptor }> = {
  1: {
    open: msg({ message: 'Repeats every {weekday}', comment: 'weekday is a day name, e.g. Thursday' }),
    until: msg({
      message: 'Repeats every {weekday} until {date}',
      comment: 'weekday is a day name, e.g. Thursday. date is the last date',
    }),
  },
  2: {
    open: msg({ message: 'Repeats every other {weekday}', comment: 'weekday is a day name, e.g. Thursday' }),
    until: msg({
      message: 'Repeats every other {weekday} until {date}',
      comment: 'weekday is a day name, e.g. Thursday. date is the last date',
    }),
  },
};

export const repeatsLabel = ({ weekday, every, endsOn }: Pick<SeriesInfo, 'weekday' | 'every' | 'endsOn'>) => {
  const messages = REPEATS[every];
  const values = { weekday: weekdayName(weekday) };
  if (!endsOn) return { ...messages.open, values };
  return { ...messages.until, values: { ...values, date: formatDate(date(endsOn), SHORT_DATE) } };
};

export const When = z.enum(['now', 'later']);
export type When = z.infer<typeof When>;

export const WHEN_LABELS: Record<When, MessageDescriptor> = {
  [When.enum.now]: msg({ message: 'Now', comment: 'Session start option: start right away' }),
  [When.enum.later]: msg({ message: 'Later', comment: 'Session start option: pick a date and time' }),
};

export const REPEAT_LABELS: Record<Repeat, MessageDescriptor> = {
  [Repeat.enum.none]: msg({ message: 'Once', comment: 'Session repeat option: no repeat' }),
  [Repeat.enum.weekly]: msg({ message: 'Weekly', comment: 'Session repeat option' }),
  [Repeat.enum.biweekly]: msg({ message: 'Every 2 weeks', comment: 'Session repeat option' }),
};

export type Schedule = { when: When; day: string | null; time: string; repeat: Repeat; endsOn: string | null };

export const NOW: Schedule = { when: When.enum.now, day: null, time: '18:00', repeat: Repeat.enum.none, endsOn: null };

export const lastScheduleDay = () => today().add(MAX_DAYS_AHEAD, 'day').format(ISO_DAY);

export const scheduledAtOf = ({ when, day, time }: Schedule) =>
  when === When.enum.later && day && time ? fromWall(day, time) : null;

export const seriesPlanOf = (schedule: Schedule): SeriesPlan | null => {
  const every = REPEAT_WEEKS[schedule.repeat];
  return schedule.when === When.enum.later && every ? { every, endsOn: schedule.endsOn } : null;
};

export const ScheduleProblem = z.enum(['missing', 'past', 'tooFar']);
export type ScheduleProblem = z.infer<typeof ScheduleProblem>;

export const SCHEDULE_PROBLEMS: Record<ScheduleProblem, MessageDescriptor> = {
  [ScheduleProblem.enum.missing]: msg`Pick a date and a time.`,
  [ScheduleProblem.enum.past]: msg`That time has passed. Pick a later one.`,
  [ScheduleProblem.enum.tooFar]: msg({ message: 'Pick a date in the next {days} days.', comment: 'days is a number' }),
};

export const scheduleProblem = (schedule: Schedule): ScheduleProblem | null => {
  if (schedule.when === When.enum.now) return null;
  const at = scheduledAtOf(schedule);
  if (!at) return ScheduleProblem.enum.missing;
  if (!dayjs(at).isAfter(dayjs())) return ScheduleProblem.enum.past;
  return canSchedule(at) ? null : ScheduleProblem.enum.tooFar;
};

export const scheduleMessage = (problem: ScheduleProblem): MessageDescriptor => ({
  ...SCHEDULE_PROBLEMS[problem],
  values: { days: MAX_DAYS_AHEAD },
});

export const FULL = msg({ message: 'Full', comment: 'A session that has reached its player limit' });

type PlayerLimit = Pick<SessionSummary, 'playerCount' | 'maxPlayers'>;

export const isFull = ({ playerCount, maxPlayers }: PlayerLimit) => maxPlayers !== null && playerCount >= maxPlayers;

export const playerCountText = ({ playerCount, maxPlayers }: PlayerLimit) =>
  maxPlayers === null ? String(playerCount) : `${playerCount}/${maxPlayers}`;

export const playerLimitOf = (session: Pick<Session, 'players' | 'maxPlayers'>): PlayerLimit => ({
  playerCount: session.players.length,
  maxPlayers: session.maxPlayers ?? null,
});

export const sessionMinutes = ({ startedAt, finishedAt }: Pick<SessionSummary, 'startedAt' | 'finishedAt'>) =>
  startedAt && finishedAt ? dayjs(finishedAt).diff(startedAt, 'minute') : null;

export const SCAN_LABELS: Record<SessionStatus, MessageDescriptor> = {
  [SessionStatus.enum.open]: msg({ message: 'Scan to join', comment: 'Next to a QR code that opens the session' }),
  [SessionStatus.enum.running]: msg({
    message: 'Scan to follow',
    comment: 'Next to a QR code that opens the live scores',
  }),
  [SessionStatus.enum.finished]: msg({
    message: 'Scan for the results',
    comment: 'Next to a QR code that opens the final standings',
  }),
};
