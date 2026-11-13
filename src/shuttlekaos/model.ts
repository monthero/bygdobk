import { z } from 'zod';

export const Format = z.enum(['americano', 'mexicano']);
export type Format = z.infer<typeof Format>;

export const PlayStyle = z.enum(['singles', 'doubles']);
export type PlayStyle = z.infer<typeof PlayStyle>;

export const Partners = z.enum(['rotating', 'fixed']);
export type Partners = z.infer<typeof Partners>;

export const ScoreMode = z.enum(['total', 'race']);
export type ScoreMode = z.infer<typeof ScoreMode>;

export const SessionStatus = z.enum(['open', 'running', 'finished']);
export type SessionStatus = z.infer<typeof SessionStatus>;

export const Level = z.enum(['E', 'A', 'B', 'C', 'D']);
export type Level = z.infer<typeof Level>;

export const Repeat = z.enum(['none', 'weekly', 'biweekly']);
export type Repeat = z.infer<typeof Repeat>;

export const EVERYONE_ONCE = 'everyone';

export const MAX_COURTS = 12;
export const MAX_PLAYERS = 64;
export const MAX_ROUNDS = 40;
export const MAX_NAME = 40;
export const MIN_PLAYER_LIMIT = 2;

export const SessionLocation = z.object({
  locationId: z.uuid(),
  name: z.string().trim().min(1).max(80),
  address: z.string().trim().max(160).nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type SessionLocation = z.infer<typeof SessionLocation>;

export const PlayerLimit = z.number().int().min(MIN_PLAYER_LIMIT).max(MAX_PLAYERS);

export const Settings = z.object({
  format: Format,
  style: PlayStyle,
  partners: Partners,
  courts: z.number().int().min(1).max(MAX_COURTS),
  scoreMode: ScoreMode,
  points: z.number().int().min(1).max(99),
  sets: z.union([z.literal(1), z.literal(3)]),
  rounds: z.union([z.number().int().min(1).max(MAX_ROUNDS), z.literal(EVERYONE_ONCE)]).nullable(),
  levels: z.array(Level).max(Level.options.length),
});
export type Settings = z.infer<typeof Settings>;

export const Player = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(MAX_NAME),
  profileId: z.uuid().nullable(),
  avatarUrl: z.string().nullable(),
});
export type Player = z.infer<typeof Player>;

export const Pair = z.tuple([z.string(), z.string()]);
export type Pair = z.infer<typeof Pair>;

export const Game = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
export type Game = z.infer<typeof Game>;

export const Match = z.object({
  id: z.string().min(1),
  court: z.number().int().min(1),
  sides: z.tuple([z.array(z.string()).min(1).max(2), z.array(z.string()).min(1).max(2)]),
  games: z.array(Game).max(3),
  endedAt: z.iso.datetime({ offset: true }).optional(),
});
export type Match = z.infer<typeof Match>;

export const Round = z.object({
  number: z.number().int().min(1),
  matches: z.array(Match),
  resting: z.array(z.string()),
  startedAt: z.iso.datetime({ offset: true }).optional(),
});
export type Round = z.infer<typeof Round>;

export const Session = z.object({
  id: z.uuid(),
  version: z.literal(1),
  revision: z.number().int().min(0),
  title: z.string().trim().max(80),
  isPublic: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  startedAt: z.iso.datetime({ offset: true }).nullable(),
  finishedAt: z.iso.datetime({ offset: true }).nullable(),
  status: SessionStatus,
  settings: Settings,
  players: z.array(Player).max(MAX_PLAYERS),
  pairs: z.array(Pair),
  rounds: z.array(Round),
  location: SessionLocation.nullable().optional(),
  scheduledAt: z.iso.datetime({ offset: true }).nullable().optional(),
  maxPlayers: PlayerLimit.nullable().optional(),
  seriesId: z.uuid().nullable().optional(),
});
export type Session = z.infer<typeof Session>;

export const WeeksBetween = z.union([z.literal(1), z.literal(2)]);
export type WeeksBetween = z.infer<typeof WeeksBetween>;

export const SeriesInfo = z.object({
  id: z.uuid(),
  weekday: z.number().int().min(1).max(7),
  every: WeeksBetween,
  endsOn: z.iso.date().nullable(),
});
export type SeriesInfo = z.infer<typeof SeriesInfo>;

export type Standing = {
  entrantId: string;
  playerIds: string[];
  rank: number;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  setsWon: number;
  setsLost: number;
  pointsFor: number;
  pointsAgainst: number;
};

export type SessionSummary = {
  id: string;
  shareCode: string;
  title: string;
  status: SessionStatus;
  isPublic: boolean;
  levels: Level[];
  organizerName: string;
  playerCount: number;
  maxPlayers: number | null;
  createdAt: string;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  series: SeriesInfo | null;
  isOwner: boolean;
  isActive: boolean;
  location: SessionLocation | null;
  format: Format;
  style: PlayStyle;
  myResult: Pick<Standing, 'rank' | 'played' | 'won' | 'pointsFor'> | null;
};

export type SessionSummaryPage = { total: number; items: SessionSummary[] };

export type PublicSession = Omit<SessionSummary, 'isOwner' | 'isActive' | 'myResult'> & { organizerId: string };

export type AccountMatch = { profileId: string; name: string; avatarUrl: string | null; busy: boolean };

export const SetupProblem = z.enum([
  'tooFewPlayers',
  'tooManyPlayers',
  'duplicateNames',
  'pairsIncomplete',
  'invalidSettings',
]);
export type SetupProblem = z.infer<typeof SetupProblem>;

export const GamesProblem = z.enum([
  'wrongGameCount',
  'totalMismatch',
  'targetNotReached',
  'overTarget',
  'bothReachedTarget',
  'alreadyDecided',
]);
export type GamesProblem = z.infer<typeof GamesProblem>;
