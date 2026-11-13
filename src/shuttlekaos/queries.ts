import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { FunctionsFetchError, FunctionsHttpError, type REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { skipToken, useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { z } from 'zod';

import { queryClient } from '~/cms/queryClient';
import { useSessionUserId } from '~/components/auth/hooks';
import { getSupabase } from '~/supabase/client';

import { shortLinkedNames } from './engine';
import {
  Format,
  Level,
  PlayStyle,
  SeriesInfo,
  Session,
  SessionLocation,
  SessionStatus,
  type AccountMatch,
  type PublicSession,
  type SessionSummary,
  type SessionSummaryPage,
  type SetupProblem,
} from './model';
import {
  Nudge,
  NUDGE_EVENT,
  sessionTopic,
  ShuttleKaosAction,
  ShuttleKaosFailure,
  ShuttleKaosProblem,
  ShuttleKaosReply,
  type SeriesPlan,
  type ShuttleKaosRequest,
} from './store';

const SESSION_KEY = 'shuttlekaos-session';
const PUBLIC_KEY = 'shuttlekaos-public';
const MY_SESSIONS_KEY = 'shuttlekaos-mine';
export const PAGE_SIZE = 10;
const ACCOUNTS_KEY = 'shuttlekaos-accounts';
const FINDABLE_KEY = 'shuttlekaos-findable';
const CHAT_KEY = 'shuttlekaos-chat';
const FUNCTION_NAME = 'shuttlekaos';
const MIN_SEARCH_LENGTH = 2;
const POLL_MS = 30_000;
const UNSUBSCRIBED_POLL_MS = 5000;
const CLOSE_DELAY_MS = 1000;
const LIVE = new Set<SessionStatus>([SessionStatus.enum.open, SessionStatus.enum.running]);

const MESSAGES: Record<ShuttleKaosProblem, MessageDescriptor> = {
  [ShuttleKaosProblem.enum.offline]: msg`Can't reach the server. Check your connection.`,
  [ShuttleKaosProblem.enum.loggedOut]: msg`Log in to do that.`,
  [ShuttleKaosProblem.enum.notAllowed]: msg`Only the organizer can do that.`,
  [ShuttleKaosProblem.enum.notFound]: msg`This session is gone.`,
  [ShuttleKaosProblem.enum.invalid]: msg`Something in this session doesn't add up.`,
  [ShuttleKaosProblem.enum.busy]: msg`A player is already in another session.`,
  [ShuttleKaosProblem.enum.locked]: msg`This session has started. No more changes to the players.`,
  [ShuttleKaosProblem.enum.full]: msg`This session is full.`,
  [ShuttleKaosProblem.enum.stale]: msg`Someone else changed this session. Check it and try again.`,
  [ShuttleKaosProblem.enum.tooMany]: msg`That's a lot of sessions for one day. Try again tomorrow.`,
  [ShuttleKaosProblem.enum.failed]: msg`Couldn't save. Try again.`,
};

const RPC_PROBLEMS: Record<string, ShuttleKaosProblem> = {
  '': ShuttleKaosProblem.enum.offline,
  '42501': ShuttleKaosProblem.enum.loggedOut,
  '22023': ShuttleKaosProblem.enum.invalid,
  P0002: ShuttleKaosProblem.enum.notFound,
  SKNOA: ShuttleKaosProblem.enum.notAllowed,
  PT429: ShuttleKaosProblem.enum.tooMany,
};

export class ShuttleKaosError extends Error {
  readonly problem: ShuttleKaosProblem;
  readonly busyNames: string[];
  readonly setup: SetupProblem | null;

  constructor(
    problem: ShuttleKaosProblem,
    details: Omit<ShuttleKaosFailure, 'error' | 'session'> = {},
    cause?: unknown,
  ) {
    super(problem, { cause });
    this.problem = problem;
    this.busyNames = details.names ?? [];
    this.setup = details.setup ?? null;
  }
}

export const shuttleKaosProblemMessage = (problem: ShuttleKaosProblem) => MESSAGES[problem];

export const shuttleKaosErrorMessage = (error: unknown) =>
  shuttleKaosProblemMessage(error instanceof ShuttleKaosError ? error.problem : ShuttleKaosProblem.enum.failed);

const RpcError = z.object({ code: z.string() });

const rpcError = (error: unknown) =>
  new ShuttleKaosError(
    RPC_PROBLEMS[RpcError.safeParse(error).data?.code ?? 'unknown'] ?? ShuttleKaosProblem.enum.failed,
    {},
    error,
  );

const functionFailure = async (error: unknown): Promise<ShuttleKaosFailure> => {
  if (error instanceof FunctionsFetchError) return { error: ShuttleKaosProblem.enum.offline };
  if (!(error instanceof FunctionsHttpError) || !(error.context instanceof Response)) {
    return { error: ShuttleKaosProblem.enum.failed };
  }
  const body = ShuttleKaosFailure.safeParse(await error.context.json().catch(() => null));
  if (body.success) return body.data;
  if (error.context.status === 401) return { error: ShuttleKaosProblem.enum.loggedOut };
  return { error: ShuttleKaosProblem.enum.failed };
};

const SessionView = z.object({
  isOwner: z.boolean(),
  myPlayerId: z.string().nullable(),
  shareCode: z.string(),
  series: SeriesInfo.nullable().catch(null),
  session: Session,
});
export type SessionView = z.infer<typeof SessionView>;

const MaybeSessionView = SessionView.nullable();

const SummaryFields = {
  id: z.uuid(),
  shareCode: z.string(),
  title: z.string(),
  status: SessionStatus,
  isPublic: z.boolean(),
  levels: z.array(Level),
  organizerName: z.string(),
  playerCount: z.number().int(),
  maxPlayers: z.number().int().nullable().catch(null),
  createdAt: z.string(),
  scheduledAt: z.string().nullable().catch(null),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  series: SeriesInfo.nullable().catch(null),
};

const PublicList = z.array(
  z.object({
    ...SummaryFields,
    format: Format,
    style: PlayStyle,
    organizerId: z.uuid(),
    location: SessionLocation.nullable().catch(null),
  }),
) satisfies z.ZodType<PublicSession[]>;

const SummaryList = z.array(
  z.object({
    ...SummaryFields,
    isOwner: z.boolean(),
    isActive: z.boolean(),
    location: SessionLocation.nullable().catch(null),
    format: Format,
    style: PlayStyle,
    myResult: z
      .object({ rank: z.number().int(), played: z.number().int(), won: z.number().int(), pointsFor: z.number().int() })
      .nullable(),
  }),
) satisfies z.ZodType<SessionSummary[]>;

const SummaryPage = z.object({ total: z.number().int(), items: SummaryList }) satisfies z.ZodType<SessionSummaryPage>;

const AccountList = z.array(
  z.object({ profileId: z.uuid(), name: z.string(), avatarUrl: z.string().nullable(), busy: z.boolean() }),
) satisfies z.ZodType<AccountMatch[]>;

const Findable = z.boolean();

const Count = z.number().int();

const ChatMessage = z.object({
  id: z.uuid(),
  profileId: z.uuid(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  body: z.string(),
  createdAt: z.string(),
  mine: z.boolean(),
  canDelete: z.boolean(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

const ChatMessages = z.array(ChatMessage);

export const MatchResult = z.enum(['won', 'lost', 'drawn']);
export type MatchResult = z.infer<typeof MatchResult>;

const MyStats = z.object({
  totals: z.object({
    sessions: Count,
    played: Count,
    won: Count,
    lost: Count,
    drawn: Count,
    pointsFor: Count,
    pointsAgainst: Count,
    averagePlace: z.number().nullable(),
    bestPlace: Count.nullable(),
    wins: Count,
    podiums: Count,
  }),
  form: z.array(
    z.object({
      shareCode: z.string(),
      title: z.string(),
      startedAt: z.string(),
      rank: Count,
      entrants: Count,
      played: Count,
      won: Count,
      pointsFor: Count,
      pointsAgainst: Count,
    }),
  ),
  recentMatches: z.array(
    z.object({
      shareCode: z.string(),
      title: z.string(),
      round: Count,
      result: MatchResult,
      pointsFor: Count,
      pointsAgainst: Count,
    }),
  ),
  partners: z.array(
    z.object({
      name: z.string(),
      profileId: z.uuid().nullable(),
      avatarUrl: z.string().nullable(),
      played: Count,
      won: Count,
    }),
  ),
});
export type MyStats = z.infer<typeof MyStats>;

type SessionKey = readonly [typeof SESSION_KEY, string, string | undefined];
type PublicKey = readonly [typeof PUBLIC_KEY, string];
type MyActiveKey = readonly [typeof MY_SESSIONS_KEY, string | undefined, 'active'];
type MyHistoryKey = readonly [typeof MY_SESSIONS_KEY, string | undefined, 'history', number];
type MyStatsKey = readonly [typeof MY_SESSIONS_KEY, string | undefined, 'stats'];
type AccountsKey = readonly [typeof ACCOUNTS_KEY, string | undefined, string];
type ChatKey = readonly [typeof CHAT_KEY, string];
type SendVariables = { code: string; body: string };
type DeleteMessageVariables = { code: string; id: string };
type FindableKey = readonly [typeof FINDABLE_KEY, string | undefined];
type QueryOptions<TData, T, TKey extends readonly unknown[]> = Omit<
  UseQueryOptions<TData, Error, T, TKey>,
  'queryKey' | 'queryFn'
>;
type MutationOptions<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;
type StartVariables = { code: string; revision: number };
type LinkVariables = { code: string; playerId: string; profileId: string | null };
type CreateVariables = { session: Session; series?: SeriesPlan | null };

const callRpc = async (name: string, args?: Record<string, unknown>): Promise<unknown> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw rpcError(error);
  return data;
};

const updateViews = (update: (view: SessionView) => SessionView | null) =>
  queryClient.setQueriesData<SessionView | null>({ queryKey: [SESSION_KEY] }, (view) => (view ? update(view) : view));

const putSession = (session: Session) =>
  updateViews((view) => (view.session.id === session.id ? { ...view, session } : view));

const callFunction = async (request: ShuttleKaosRequest) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body: request });
  if (error) {
    const failure = await functionFailure(error);
    if (failure.error === ShuttleKaosProblem.enum.stale) await queryClient.refetchQueries({ queryKey: [SESSION_KEY] });
    throw new ShuttleKaosError(failure.error, failure, error);
  }
  return ShuttleKaosReply.parse(data);
};

const refreshLists = () =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: [MY_SESSIONS_KEY] }),
    queryClient.invalidateQueries({ queryKey: [PUBLIC_KEY] }),
  ]);

const refreshAll = () => Promise.all([refreshLists(), queryClient.invalidateQueries({ queryKey: [SESSION_KEY] })]);

const fetchSession = async (code: string) => {
  const view = MaybeSessionView.parse(await callRpc('shuttlekaos_session', { p_code: code }));
  return view && { ...view, session: { ...view.session, players: shortLinkedNames(view.session.players) } };
};

const fetchPublic = async (levels: string[]) =>
  PublicList.parse(await callRpc('public_shuttlekaos_sessions', { p_levels: levels }));

const fetchMyActive = async () => SummaryList.parse(await callRpc('my_shuttlekaos_active'));

const fetchMyHistory = async (page: number) =>
  SummaryPage.parse(await callRpc('my_shuttlekaos_history', { p_offset: (page - 1) * PAGE_SIZE, p_limit: PAGE_SIZE }));

const fetchChat = async (code: string) => ChatMessages.parse(await callRpc('shuttlekaos_messages', { p_code: code }));

const sendMessage = async ({ code, body }: SendVariables) => {
  await callRpc('send_shuttlekaos_message', { p_code: code, p_body: body });
};

const deleteMessage = async ({ id }: DeleteMessageVariables) => {
  await callRpc('delete_shuttlekaos_message', { p_id: id });
};

const fetchMyStats = async () => MyStats.parse(await callRpc('my_shuttlekaos_stats'));

const searchAccounts = async (query: string) =>
  AccountList.parse(await callRpc('search_shuttlekaos_accounts', { p_query: query }));

const fetchFindable = async () => Findable.parse(await callRpc('my_shuttlekaos_findable'));

const setFindable = async (findable: boolean) => {
  await callRpc('set_shuttlekaos_findable', { p_findable: findable });
};

const createSession = ({ session, series }: CreateVariables) =>
  callFunction({ action: ShuttleKaosAction.enum.create, session, series });

const endSeries = async (seriesId: string) => {
  await callRpc('end_shuttlekaos_series', { p_series: seriesId });
};

const saveSession = async (session: Session) => {
  const previous = queryClient.getQueriesData<SessionView | null>({ queryKey: [SESSION_KEY] });
  await queryClient.cancelQueries({ queryKey: [SESSION_KEY] });
  putSession(session);
  try {
    const saved = await callFunction({ action: ShuttleKaosAction.enum.save, session });
    if (saved.session) putSession(saved.session);
    return saved;
  } catch (error) {
    if (!(error instanceof ShuttleKaosError && error.problem === ShuttleKaosProblem.enum.stale)) {
      for (const [key, view] of previous) queryClient.setQueryData(key, view);
    }
    throw error;
  }
};

const startSession = async ({ code, revision }: StartVariables) => {
  const started = await callFunction({ action: ShuttleKaosAction.enum.start, code, revision });
  if (started.session) putSession(started.session);
  return started;
};

const joinSession = (code: string) => callFunction({ action: ShuttleKaosAction.enum.join, code });

const leaveSession = (code: string) => callFunction({ action: ShuttleKaosAction.enum.leave, code });

const linkPlayer = async ({ code, playerId, profileId }: LinkVariables) => {
  const linked = await callFunction({ action: ShuttleKaosAction.enum.link, code, playerId, profileId });
  if (linked.session) putSession(linked.session);
  return linked;
};

const deleteSession = async (code: string) => {
  const deleted = await callFunction({ action: ShuttleKaosAction.enum.delete, code });
  queryClient.removeQueries({ queryKey: [SESSION_KEY, deleted.shareCode] });
  return deleted;
};

type PolledQuery = { state: { data: SessionView | null | undefined } };

const isLive = ({ state }: PolledQuery) =>
  state.data !== null && state.data !== undefined && LIVE.has(state.data.session.status);

const pollSubscribed = (query: PolledQuery) => (isLive(query) ? POLL_MS : false);

const pollUnsubscribed = (query: PolledQuery) => (isLive(query) ? UNSUBSCRIBED_POLL_MS : false);

const cachedRevision = (shareCode: string) =>
  Math.max(
    -1,
    ...queryClient
      .getQueriesData<SessionView | null>({ queryKey: [SESSION_KEY, shareCode] })
      .map(([, view]) => view?.session.revision ?? -1),
  );

const onNudge = (shareCode: string, payload: unknown) => {
  const nudge = Nudge.safeParse(payload);
  if (!nudge.success) return;
  if ('chat' in nudge.data) {
    void queryClient.invalidateQueries({ queryKey: [CHAT_KEY, shareCode] });
    return;
  }
  if ('deleted' in nudge.data) {
    void queryClient.refetchQueries({ queryKey: [SESSION_KEY, shareCode] });
    void refreshLists();
    return;
  }
  if (nudge.data.revision > cachedRevision(shareCode)) {
    void queryClient.invalidateQueries({ queryKey: [SESSION_KEY, shareCode] });
  }
};

type Watch = {
  subscribed: boolean;
  listeners: Set<() => void>;
  stop: () => void;
  closing?: ReturnType<typeof setTimeout>;
};

const watches = new Map<string, Watch>();

// Not the enum value: importing it puts all of realtime-js in the entry bundle.
const isJoined = (status: `${REALTIME_SUBSCRIBE_STATES}`) => status === 'SUBSCRIBED';

const openWatch = (shareCode: string) => {
  let stopped = false;
  const watch: Watch = { subscribed: false, listeners: new Set(), stop: () => (stopped = true) };
  void getSupabase().then((supabase) => {
    if (stopped) return;
    const channel = supabase
      .channel(sessionTopic(shareCode))
      .on('broadcast', { event: NUDGE_EVENT }, ({ payload }) => onNudge(shareCode, payload))
      .subscribe((status) => {
        watch.subscribed = isJoined(status);
        for (const listener of watch.listeners) listener();
      });
    watch.stop = () => void supabase.removeChannel(channel);
  });
  return watch;
};

// Closing a little later lets a quick remount, such as React's strict mode, reuse the channel.
const watchSession = (shareCode: string, listener: () => void) => {
  if (!shareCode) return () => undefined;
  const watch = watches.get(shareCode) ?? openWatch(shareCode);
  watches.set(shareCode, watch);
  clearTimeout(watch.closing);
  watch.listeners.add(listener);
  return () => {
    watch.listeners.delete(listener);
    if (watch.listeners.size > 0) return;
    watch.closing = setTimeout(() => {
      watch.stop();
      watches.delete(shareCode);
    }, CLOSE_DELAY_MS);
  };
};

const useSessionNudges = (shareCode: string) => {
  const subscribe = useCallback((listener: () => void) => watchSession(shareCode, listener), [shareCode]);
  const isSubscribed = useCallback(() => watches.get(shareCode)?.subscribed ?? false, [shareCode]);
  return useSyncExternalStore(subscribe, isSubscribed);
};

const canonicalLevels = (levels: readonly Level[]) => Level.options.filter((level) => levels.includes(level));

export const useShuttleKaosSession = <T = SessionView | null>(
  code: string,
  options?: QueryOptions<SessionView | null, T, SessionKey>,
) => {
  const userId = useSessionUserId();
  const shareCode = code.trim().toLowerCase();
  const subscribed = useSessionNudges(shareCode);
  return useQuery({
    queryKey: [SESSION_KEY, shareCode, userId] as const,
    queryFn: shareCode ? () => fetchSession(shareCode) : skipToken,
    refetchInterval: subscribed ? pollSubscribed : pollUnsubscribed,
    ...options,
  });
};

export const usePublicSessions = <T = PublicSession[]>(
  levels: readonly Level[],
  options?: QueryOptions<PublicSession[], T, PublicKey>,
) => {
  const chosen = canonicalLevels(levels);
  return useQuery({
    queryKey: [PUBLIC_KEY, chosen.join(',')] as const,
    queryFn: () => fetchPublic(chosen),
    ...options,
  });
};

export const useMyActiveSessions = <T = SessionSummary[]>(options?: QueryOptions<SessionSummary[], T, MyActiveKey>) => {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: [MY_SESSIONS_KEY, userId, 'active'] as const,
    queryFn: userId ? fetchMyActive : skipToken,
    ...options,
  });
};

export const useMySessionHistory = <T = SessionSummaryPage>(
  page: number,
  options?: QueryOptions<SessionSummaryPage, T, MyHistoryKey>,
) => {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: [MY_SESSIONS_KEY, userId, 'history', page] as const,
    queryFn: userId ? () => fetchMyHistory(page) : skipToken,
    ...options,
  });
};

export const useMyStats = <T = MyStats>(options?: QueryOptions<MyStats, T, MyStatsKey>) => {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: [MY_SESSIONS_KEY, userId, 'stats'] as const,
    queryFn: userId ? fetchMyStats : skipToken,
    ...options,
  });
};

export const useAccountSearch = <T = AccountMatch[]>(
  query: string,
  options?: QueryOptions<AccountMatch[], T, AccountsKey>,
) => {
  const userId = useSessionUserId();
  const term = query.trim();
  return useQuery({
    queryKey: [ACCOUNTS_KEY, userId, term] as const,
    queryFn: userId && term.length >= MIN_SEARCH_LENGTH ? () => searchAccounts(term) : skipToken,
    ...options,
  });
};

export const useFindable = <T = boolean>(options?: QueryOptions<boolean, T, FindableKey>) => {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: [FINDABLE_KEY, userId] as const,
    queryFn: userId ? fetchFindable : skipToken,
    ...options,
  });
};

export const useSetFindable = (options?: MutationOptions<void, boolean>) =>
  useMutation({
    mutationFn: setFindable,
    onSettled: () => queryClient.invalidateQueries({ queryKey: [FINDABLE_KEY] }),
    ...options,
  });

export const useCreateSession = (options?: MutationOptions<ShuttleKaosReply, CreateVariables>) =>
  useMutation({ mutationFn: createSession, onSettled: refreshLists, ...options });

export const useEndSeries = (options?: MutationOptions<void, string>) =>
  useMutation({ mutationFn: endSeries, onSettled: refreshAll, ...options });

export const useSaveSession = (options?: MutationOptions<ShuttleKaosReply, Session>) =>
  useMutation({ mutationFn: saveSession, onSettled: refreshLists, ...options });

export const useStartSession = (options?: MutationOptions<ShuttleKaosReply, StartVariables>) =>
  useMutation({ mutationFn: startSession, onSettled: refreshLists, ...options });

export const useJoinSession = (options?: MutationOptions<ShuttleKaosReply, string>) =>
  useMutation({ mutationFn: joinSession, onSettled: refreshAll, ...options });

export const useLeaveSession = (options?: MutationOptions<ShuttleKaosReply, string>) =>
  useMutation({ mutationFn: leaveSession, onSettled: refreshAll, ...options });

export const useLinkPlayer = (options?: MutationOptions<ShuttleKaosReply, LinkVariables>) =>
  useMutation({ mutationFn: linkPlayer, onSettled: refreshAll, ...options });

export const useDeleteSession = (options?: MutationOptions<ShuttleKaosReply, string>) =>
  useMutation({ mutationFn: deleteSession, onSettled: refreshLists, ...options });

const CHAT_POLL_MS = 15_000;

const refreshChat = (_: unknown, __: unknown, { code }: { code: string }) =>
  queryClient.invalidateQueries({ queryKey: [CHAT_KEY, code] });

export const useSessionChat = <T = ChatMessage[]>(code: string, options?: QueryOptions<ChatMessage[], T, ChatKey>) => {
  const shareCode = code.trim().toLowerCase();
  const subscribed = useSessionNudges(shareCode);
  return useQuery({
    queryKey: [CHAT_KEY, shareCode] as const,
    queryFn: () => fetchChat(shareCode),
    refetchInterval: subscribed ? false : CHAT_POLL_MS,
    ...options,
  });
};

export const useSendMessage = (options?: MutationOptions<void, SendVariables>) =>
  useMutation({ mutationFn: sendMessage, onSettled: refreshChat, ...options });

export const useDeleteMessage = (options?: MutationOptions<void, DeleteMessageVariables>) =>
  useMutation({ mutationFn: deleteMessage, onSettled: refreshChat, ...options });
