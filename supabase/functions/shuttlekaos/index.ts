import { withSupabase, type SupabaseContext } from '@supabase/server';
import { z } from 'zod';

import { gamesProblem, setPlayers, setupProblem, standings, startSession } from '../../../src/shuttlekaos/engine.ts';
import {
  MAX_NAME,
  MAX_PLAYERS,
  MAX_ROUNDS,
  Session,
  SessionStatus,
  type Player,
  type Settings,
} from '../../../src/shuttlekaos/model.ts';
import {
  isStale,
  ShuttleKaosAction,
  ShuttleKaosProblem,
  ShuttleKaosRequest,
  sessionTopic,
  NUDGE_EVENT,
  type Nudge,
  type ShuttleKaosFailure,
} from '../../../src/shuttlekaos/store.ts';
import { reply, withCors } from '../_shared/http.ts';

type Admin = SupabaseContext['supabaseAdmin'];

const MAX_BODY_BYTES = 262_144;
const WRITE_TRIES = 3;
const NUDGE_TIMEOUT_MS = 3000;
const ROW_COLUMNS = 'id, owner_id, share_code, revision, status, updated_at, removed_profile_ids, data';

const STATUS: Record<ShuttleKaosProblem, number> = {
  [ShuttleKaosProblem.enum.offline]: 503,
  [ShuttleKaosProblem.enum.loggedOut]: 401,
  [ShuttleKaosProblem.enum.notAllowed]: 403,
  [ShuttleKaosProblem.enum.notFound]: 404,
  [ShuttleKaosProblem.enum.invalid]: 400,
  [ShuttleKaosProblem.enum.busy]: 409,
  [ShuttleKaosProblem.enum.locked]: 409,
  [ShuttleKaosProblem.enum.full]: 409,
  [ShuttleKaosProblem.enum.stale]: 409,
  [ShuttleKaosProblem.enum.tooMany]: 429,
  [ShuttleKaosProblem.enum.failed]: 500,
};

const DB_PROBLEMS: Record<string, ShuttleKaosProblem> = {
  SKBSY: ShuttleKaosProblem.enum.busy,
  SKSTL: ShuttleKaosProblem.enum.stale,
  '42501': ShuttleKaosProblem.enum.notAllowed,
  P0002: ShuttleKaosProblem.enum.notFound,
  PT429: ShuttleKaosProblem.enum.tooMany,
  '22023': ShuttleKaosProblem.enum.invalid,
  '22007': ShuttleKaosProblem.enum.invalid,
  '22P02': ShuttleKaosProblem.enum.invalid,
  '23505': ShuttleKaosProblem.enum.invalid,
};

const Row = z.object({
  id: z.uuid(),
  owner_id: z.uuid(),
  share_code: z.string(),
  revision: z.number().int(),
  status: SessionStatus,
  updated_at: z.string(),
  removed_profile_ids: z.array(z.uuid()),
  data: Session,
});
type Row = z.infer<typeof Row>;

const Written = z.object({ shareCode: z.string(), session: Session });
type Written = z.infer<typeof Written>;
type Outcome = { shareCode: string; session: Session | null; nudge: Nudge | null };
const DbError = z.object({ code: z.string(), details: z.string().nullish() });
const Names = z.array(z.string()).catch([]);
const Profile = z.object({ name: z.string(), avatar_url: z.string().nullable() });
const LinkTarget = z.object({ avatar_url: z.string().nullable(), shuttlekaos_findable: z.boolean() });

class Rejection extends Error {
  constructor(
    readonly problem: ShuttleKaosProblem,
    readonly extra: Omit<ShuttleKaosFailure, 'error'> = {},
  ) {
    super(problem);
  }
}

const fail = (problem: ShuttleKaosProblem, extra: Omit<ShuttleKaosFailure, 'error'> = {}) =>
  reply(STATUS[problem], { error: problem, ...extra });

const parseNames = (details: string | null | undefined) => {
  try {
    return Names.parse(JSON.parse(details ?? ''));
  } catch {
    return [];
  }
};

const rejectionOf = (error: unknown) => {
  const db = DbError.safeParse(error);
  const problem = db.success ? DB_PROBLEMS[db.data.code] : undefined;
  if (!problem) return error;
  if (problem === ShuttleKaosProblem.enum.busy) return new Rejection(problem, { names: parseNames(db.data?.details) });
  return new Rejection(problem);
};

const isRejected = (error: unknown, problem: ShuttleKaosProblem) =>
  error instanceof Rejection && error.problem === problem;

const changed = ({ shareCode, session }: Written): Outcome => ({
  shareCode,
  session,
  nudge: { revision: session.revision },
});

const changedHidden = (written: Written): Outcome => ({ ...changed(written), session: null });

const unchanged = (shareCode: string): Outcome => ({ shareCode, session: null, nudge: null });

const nowIso = () => new Date().toISOString();

const isIdle = (row: Row) => isStale({ status: row.status, updatedAt: row.updated_at });

const loadRow = async (admin: Admin, column: 'id' | 'share_code', value: string) => {
  const { data, error } = await admin.from('shuttlekaos_sessions').select(ROW_COLUMNS).eq(column, value).maybeSingle();
  if (error) throw error;
  if (!data) throw new Rejection(ShuttleKaosProblem.enum.notFound);
  return Row.parse(data);
};

const ownRow = async (admin: Admin, column: 'id' | 'share_code', value: string, userId: string) => {
  const row = await loadRow(admin, column, value);
  if (row.owner_id !== userId) throw new Rejection(ShuttleKaosProblem.enum.notAllowed);
  return row;
};

const checkRevision = (row: Row, expected: number) => {
  if (row.revision !== expected) throw new Rejection(ShuttleKaosProblem.enum.stale, { session: row.data });
};

const resultsOf = (session: Session) => {
  if (session.status === SessionStatus.enum.open) return [];
  const profiles = new Map(session.players.map((player) => [player.id, player.profileId]));
  return standings(session).flatMap((standing) =>
    standing.playerIds.flatMap((playerId) => {
      const profileId = profiles.get(playerId);
      return profileId ? [{ ...standing, profileId }] : [];
    }),
  );
};

const write = async (admin: Admin, owner: string, session: Session, expected: number | null, removed: string[]) => {
  const { data, error } = await admin.rpc('shuttlekaos_write', {
    p_owner: owner,
    p_data: session,
    p_expected: expected,
    p_removed: removed,
    p_results: resultsOf(session),
  });
  if (error) throw rejectionOf(error);
  return Written.parse(data);
};

const unlinkRemoved = (players: Player[], removed: string[]) => {
  const gone = new Set(removed);
  return players.map((player) =>
    player.profileId && gone.has(player.profileId) ? { ...player, profileId: null, avatarUrl: null } : player,
  );
};

const roundLimit = ({ rounds }: Settings) => (typeof rounds === 'number' ? rounds : MAX_ROUNDS);

const isValidLineup = (session: Session) => {
  const playerIds = new Set(session.players.map((player) => player.id));
  const profileIds = session.players.flatMap((player) => (player.profileId ? [player.profileId] : []));
  const knows = (ids: Iterable<string>) => new Set(ids).isSubsetOf(playerIds);
  const matches = session.rounds.flatMap((round) => round.matches);
  return (
    playerIds.size === session.players.length &&
    new Set(profileIds).size === profileIds.length &&
    knows(session.pairs.flat()) &&
    session.rounds.length <= roundLimit(session.settings) &&
    (session.status !== SessionStatus.enum.open || session.rounds.length === 0) &&
    session.rounds.every((round) => knows(round.resting)) &&
    matches.every(
      (match) =>
        knows(match.sides.flat()) && (match.games.length === 0 || gamesProblem(session.settings, match.games) === null),
    )
  );
};

const validated = (session: Session) => {
  if (!isValidLineup(session)) throw new Rejection(ShuttleKaosProblem.enum.invalid);
  return session;
};

const canMoveTo = (current: Session, next: SessionStatus) => {
  if (next === SessionStatus.enum.finished) return true;
  if (current.status === SessionStatus.enum.finished) {
    return next === (current.startedAt === null ? SessionStatus.enum.open : SessionStatus.enum.running);
  }
  return next === current.status;
};

const sameLineup = (current: Session, next: Session) =>
  JSON.stringify(current.settings) === JSON.stringify(next.settings) &&
  JSON.stringify(current.pairs) === JSON.stringify(next.pairs) &&
  current.players.length === next.players.length &&
  current.players.every((player, index) => player.id === next.players[index]?.id);

const freeName = (name: string, players: Player[]) => {
  const taken = new Set(players.map((player) => player.name.trim().toLocaleLowerCase()));
  const base = name.trim().slice(0, MAX_NAME);
  for (let count = 1; count <= MAX_PLAYERS + 1; count++) {
    const suffix = count === 1 ? '' : ` ${count}`;
    const candidate = `${base.slice(0, MAX_NAME - suffix.length)}${suffix}`;
    if (!taken.has(candidate.toLocaleLowerCase())) return candidate;
  }
  return base;
};

const retryStale = async <T>(attempt: () => Promise<T>) => {
  for (let tries = 1; ; tries++) {
    try {
      return await attempt();
    } catch (error) {
      if (tries >= WRITE_TRIES || !isRejected(error, ShuttleKaosProblem.enum.stale)) throw error;
    }
  }
};

const withCurrent = async (admin: Admin, sessionId: string, attempt: () => Promise<Written>) => {
  try {
    return await attempt();
  } catch (error) {
    if (!isRejected(error, ShuttleKaosProblem.enum.stale)) throw error;
    throw new Rejection(ShuttleKaosProblem.enum.stale, { session: (await loadRow(admin, 'id', sessionId)).data });
  }
};

const create = async (admin: Admin, userId: string, session: Session) => {
  const now = nowIso();
  const next = validated({
    ...session,
    version: 1,
    revision: 0,
    status: SessionStatus.enum.open,
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    finishedAt: null,
    rounds: [],
  });
  return changed(await write(admin, userId, next, null, []));
};

const save = async (admin: Admin, userId: string, session: Session) => {
  const row = await ownRow(admin, 'id', session.id, userId);
  checkRevision(row, session.revision);
  const current = row.data;
  if (!canMoveTo(current, session.status)) throw new Rejection(ShuttleKaosProblem.enum.locked);
  if (current.startedAt !== null && !sameLineup(current, session)) throw new Rejection(ShuttleKaosProblem.enum.locked);
  const finishing = session.status === SessionStatus.enum.finished;
  const next = validated({
    ...session,
    version: 1,
    revision: row.revision,
    createdAt: current.createdAt,
    updatedAt: nowIso(),
    startedAt: current.startedAt,
    finishedAt: finishing ? (current.finishedAt ?? nowIso()) : null,
    rounds: current.status === SessionStatus.enum.open ? [] : session.rounds,
    players: unlinkRemoved(session.players, row.removed_profile_ids),
  });
  return changed(
    await withCurrent(admin, row.id, () => write(admin, userId, next, row.revision, row.removed_profile_ids)),
  );
};

const start = async (admin: Admin, userId: string, code: string, revision: number) => {
  const row = await ownRow(admin, 'share_code', code, userId);
  checkRevision(row, revision);
  const current = row.data;
  if (current.status !== SessionStatus.enum.open) throw new Rejection(ShuttleKaosProblem.enum.locked);
  const setup = setupProblem(current.settings, current.players, current.pairs);
  if (setup) throw new Rejection(ShuttleKaosProblem.enum.invalid, { setup });
  const next = validated({ ...startSession(current), updatedAt: nowIso() });
  return changed(
    await withCurrent(admin, row.id, () => write(admin, userId, next, row.revision, row.removed_profile_ids)),
  );
};

const join = (admin: Admin, userId: string, code: string) =>
  retryStale(async () => {
    const row = await loadRow(admin, 'share_code', code);
    const current = row.data;
    if (current.players.some((player) => player.profileId === userId)) return unchanged(row.share_code);
    if (row.status !== SessionStatus.enum.open || isIdle(row)) throw new Rejection(ShuttleKaosProblem.enum.locked);
    if (current.players.length >= MAX_PLAYERS) throw new Rejection(ShuttleKaosProblem.enum.full);
    const { data, error } = await admin.from('profiles').select('name, avatar_url').eq('id', userId).single();
    if (error) throw error;
    const profile = Profile.parse(data);
    const me: Player = {
      id: crypto.randomUUID(),
      name: freeName(profile.name, current.players),
      profileId: userId,
      avatarUrl: profile.avatar_url,
    };
    const next = { ...setPlayers(current, [...current.players, me], current.pairs), updatedAt: nowIso() };
    const removed = row.removed_profile_ids.filter((id) => id !== userId);
    return changedHidden(await write(admin, row.owner_id, validated(next), row.revision, removed));
  });

const leave = (admin: Admin, userId: string, code: string) =>
  retryStale(async () => {
    const row = await loadRow(admin, 'share_code', code);
    const current = row.data;
    const me = current.players.find((player) => player.profileId === userId);
    if (!me) return unchanged(row.share_code);
    const idle = isIdle(row);
    const settled: Session = idle
      ? { ...current, status: SessionStatus.enum.finished, finishedAt: new Date(row.updated_at).toISOString() }
      : current;
    const next =
      settled.status === SessionStatus.enum.open
        ? setPlayers(
            settled,
            settled.players.filter((player) => player.id !== me.id),
            settled.pairs.filter((pair) => !pair.includes(me.id)),
          )
        : { ...settled, players: unlinkRemoved(settled.players, [userId]) };
    const removed = Array.from(new Set([...row.removed_profile_ids, userId]));
    return changedHidden(await write(admin, row.owner_id, { ...next, updatedAt: nowIso() }, row.revision, removed));
  });

const settledFinished = (row: Row): Session | null => {
  if (row.data.status === SessionStatus.enum.finished) return row.data;
  if (row.data.status !== SessionStatus.enum.running || !isIdle(row)) return null;
  return { ...row.data, status: SessionStatus.enum.finished, finishedAt: new Date(row.updated_at).toISOString() };
};

const link = (admin: Admin, userId: string, code: string, playerId: string, profileId: string | null) =>
  retryStale(async () => {
    const row = await loadRow(admin, 'share_code', code);
    const current = settledFinished(row);
    if (!current) throw new Rejection(ShuttleKaosProblem.enum.locked);
    const isOwner = row.owner_id === userId;
    const player = current.players.find((candidate) => candidate.id === playerId);
    if (!player) throw new Rejection(ShuttleKaosProblem.enum.notFound);
    if (player.profileId === profileId) return unchanged(row.share_code);

    let avatarUrl: string | null = null;
    let removed = row.removed_profile_ids;
    if (profileId === null) {
      if (!isOwner) throw new Rejection(ShuttleKaosProblem.enum.notAllowed);
    } else {
      const self = profileId === userId;
      if (!isOwner && !self) throw new Rejection(ShuttleKaosProblem.enum.notAllowed);
      if (player.profileId !== null) throw new Rejection(ShuttleKaosProblem.enum.invalid);
      if (current.players.some((candidate) => candidate.profileId === profileId)) {
        throw new Rejection(ShuttleKaosProblem.enum.invalid);
      }
      if (!self && removed.includes(profileId)) throw new Rejection(ShuttleKaosProblem.enum.notAllowed);
      const { data, error } = await admin
        .from('profiles')
        .select('avatar_url, shuttlekaos_findable')
        .eq('id', profileId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Rejection(ShuttleKaosProblem.enum.notFound);
      const target = LinkTarget.parse(data);
      if (!self && !target.shuttlekaos_findable) throw new Rejection(ShuttleKaosProblem.enum.notAllowed);
      avatarUrl = target.avatar_url;
      if (self) removed = removed.filter((id) => id !== userId);
    }

    const next: Session = {
      ...current,
      players: current.players.map((candidate) =>
        candidate.id === playerId ? { ...candidate, profileId, avatarUrl } : candidate,
      ),
    };
    const written = await write(admin, row.owner_id, validated(next), row.revision, removed);
    return isOwner ? changed(written) : changedHidden(written);
  });

const remove = async (admin: Admin, userId: string, code: string) => {
  const row = await ownRow(admin, 'share_code', code, userId);
  const { error } = await admin.from('shuttlekaos_sessions').delete().eq('id', row.id).eq('owner_id', userId);
  if (error) throw error;
  return { shareCode: row.share_code, session: null, nudge: { deleted: true } } satisfies Outcome;
};

const sendNudge = async (admin: Admin, shareCode: string, nudge: Nudge) => {
  const channel = admin.channel(sessionTopic(shareCode));
  try {
    const sent = await channel.httpSend(NUDGE_EVENT, nudge, { timeout: NUDGE_TIMEOUT_MS });
    if (!sent.success) console.error('ShuttleKaos broadcast failed', sent.status, sent.error);
  } catch (error) {
    console.error('ShuttleKaos broadcast failed', error);
  } finally {
    await admin.removeChannel(channel).catch(() => undefined);
  }
};

const perform = (admin: Admin, userId: string, request: ShuttleKaosRequest): Promise<Outcome> => {
  switch (request.action) {
    case ShuttleKaosAction.enum.create:
      return create(admin, userId, request.session);
    case ShuttleKaosAction.enum.save:
      return save(admin, userId, request.session);
    case ShuttleKaosAction.enum.start:
      return start(admin, userId, request.code, request.revision);
    case ShuttleKaosAction.enum.join:
      return join(admin, userId, request.code);
    case ShuttleKaosAction.enum.leave:
      return leave(admin, userId, request.code);
    case ShuttleKaosAction.enum.delete:
      return remove(admin, userId, request.code);
    case ShuttleKaosAction.enum.link:
      return link(admin, userId, request.code, request.playerId, request.profileId);
  }
};

const handle = withSupabase({ auth: 'user', cors: 'disabled', errors: { detailed: false } }, async (req, ctx) => {
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  const userId = ctx.userClaims?.id;
  if (!userId) return fail(ShuttleKaosProblem.enum.loggedOut);

  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return fail(ShuttleKaosProblem.enum.invalid);
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(ShuttleKaosProblem.enum.invalid);
  }
  const parsed = ShuttleKaosRequest.safeParse(body);
  if (!parsed.success) return fail(ShuttleKaosProblem.enum.invalid);

  try {
    const { nudge, ...result } = await perform(ctx.supabaseAdmin, userId, parsed.data);
    if (nudge) await sendNudge(ctx.supabaseAdmin, result.shareCode, nudge);
    return reply(200, result);
  } catch (error) {
    if (error instanceof Rejection) return fail(error.problem, error.extra);
    console.error('ShuttleKaos action failed', error);
    return fail(ShuttleKaosProblem.enum.failed);
  }
});

export default withCors(handle);
