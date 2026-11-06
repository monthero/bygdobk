import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { skipToken, useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { queryClient } from '~/cms/queryClient';
import { useIsAdmin, useSessionUserId } from '~/components/auth/hooks';
import { supabase } from '~/supabase/client';
import { PROFILE_REF_COLUMNS } from '~/supabase/profile';

import {
  AdminMembership,
  Membership,
  MembershipStatus,
  type MembershipInput,
  type MembershipPatch,
  type RequestInput,
} from './model';

const MEMBERSHIPS_KEY = 'memberships';

const COLUMNS = [
  'id',
  'profileId:profile_id',
  'playerName:player_name',
  'planId:plan_id',
  'startDate:start_date',
  'endDate:end_date',
  'priceNok:price_nok',
  'paidAt:paid_at',
  'paymentMethod:payment_method',
  'note',
  'status',
  'createdBy:created_by',
  'createdAt:created_at',
].join(', ');

const ADMIN_COLUMNS = `${COLUMNS}, ${PROFILE_REF_COLUMNS}, requester:profiles!created_by(name, email)`;

const MembershipProblem = z.enum(['offline', 'notAllowed', 'invalid', 'notFound', 'duplicate', 'tooMany', 'failed']);
type MembershipProblem = z.infer<typeof MembershipProblem>;

const MESSAGES: Record<MembershipProblem, MessageDescriptor> = {
  [MembershipProblem.enum.offline]: msg`Can't reach the server. Check your connection.`,
  [MembershipProblem.enum.notAllowed]: msg`Only admins can change memberships.`,
  [MembershipProblem.enum.invalid]: msg`Some of these details don't add up. Check them and try again.`,
  [MembershipProblem.enum.notFound]: msg`That membership is gone. Someone may have deleted it.`,
  [MembershipProblem.enum.duplicate]: msg`You already asked for this one. The board will get back to you.`,
  [MembershipProblem.enum.tooMany]: msg`That's a lot of open requests! Wait for the board to answer first.`,
  [MembershipProblem.enum.failed]: msg`Couldn't save the membership. Try again.`,
};

const PROBLEMS: Record<string, MembershipProblem> = {
  '': MembershipProblem.enum.offline,
  '42501': MembershipProblem.enum.notAllowed,
  '22P02': MembershipProblem.enum.invalid,
  '22007': MembershipProblem.enum.invalid,
  '22008': MembershipProblem.enum.invalid,
  '23502': MembershipProblem.enum.invalid,
  '23503': MembershipProblem.enum.invalid,
  '23514': MembershipProblem.enum.invalid,
  '23505': MembershipProblem.enum.duplicate,
  PT429: MembershipProblem.enum.tooMany,
  PGRST116: MembershipProblem.enum.notFound,
};

class MembershipError extends Error {
  readonly problem: MembershipProblem;

  constructor(problem: MembershipProblem, cause?: unknown) {
    super(problem, { cause });
    this.problem = problem;
  }
}

export const membershipErrorMessage = (error: unknown) =>
  MESSAGES[error instanceof MembershipError ? error.problem : MembershipProblem.enum.failed];

const toError = (error: { code: string }) =>
  new MembershipError(PROBLEMS[error.code] ?? MembershipProblem.enum.failed, error);

const toColumns = (input: MembershipPatch) => ({
  profile_id: input.profileId,
  player_name: input.playerName,
  plan_id: input.planId,
  start_date: input.startDate,
  end_date: input.endDate,
  price_nok: input.priceNok,
  paid_at: input.paidAt,
  payment_method: input.paymentMethod,
  note: input.note,
  status: input.status,
});

const MembershipList = z.array(Membership);
const AdminMembershipList = z.array(AdminMembership);

type MineKey = readonly [typeof MEMBERSHIPS_KEY, 'mine', string | undefined];
type AllKey = readonly [typeof MEMBERSHIPS_KEY, 'all', string | undefined];
type MineOptions<T> = Omit<UseQueryOptions<Membership[], Error, T, MineKey>, 'queryKey' | 'queryFn'>;
type AllOptions<T> = Omit<UseQueryOptions<AdminMembership[], Error, T, AllKey>, 'queryKey' | 'queryFn'>;
type MutationOptions<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;

const fetchMine = async (userId: string) => {
  const { data, error } = await supabase
    .from('memberships')
    .select(COLUMNS)
    .eq('profile_id', userId)
    .order('start_date', { ascending: false });
  if (error) throw toError(error);
  return MembershipList.parse(data);
};

const fetchAll = async () => {
  const { data, error } = await supabase
    .from('memberships')
    .select(ADMIN_COLUMNS)
    .order('start_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw toError(error);
  return AdminMembershipList.parse(data);
};

const createMembership = async (input: MembershipInput) => {
  const { data, error } = await supabase.from('memberships').insert(toColumns(input)).select(COLUMNS).single();
  if (error) throw toError(error);
  return Membership.parse(data);
};

type Update = { id: string; patch: MembershipPatch };

const updateMembership = async ({ id, patch }: Update) => {
  const { data, error } = await supabase
    .from('memberships')
    .update(toColumns(patch))
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw toError(error);
  return Membership.parse(data);
};

const requestMembership = async (userId: string | undefined, input: RequestInput) => {
  if (!userId) throw new MembershipError(MembershipProblem.enum.notAllowed);
  const { data, error } = await supabase
    .from('memberships')
    .insert({ ...toColumns(input), profile_id: userId, status: MembershipStatus.enum.requested })
    .select(COLUMNS)
    .single();
  if (error) throw toError(error);
  return Membership.parse(data);
};

const deleteMembership = async (id: string) => {
  const { data, error } = await supabase.from('memberships').delete().eq('id', id).select('id');
  if (error) throw toError(error);
  if (data.length === 0) throw new MembershipError(MembershipProblem.enum.notFound);
};

const cancelRequest = async (id: string) => {
  const { data, error } = await supabase
    .from('memberships')
    .delete()
    .eq('id', id)
    .eq('status', MembershipStatus.enum.requested)
    .select('id');
  if (error) throw toError(error);
  if (data.length === 0) throw new MembershipError(MembershipProblem.enum.notFound);
};

const invalidateMemberships = () => queryClient.invalidateQueries({ queryKey: [MEMBERSHIPS_KEY] });

export const useMyMemberships = <T = Membership[]>(options?: MineOptions<T>) => {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: [MEMBERSHIPS_KEY, 'mine', userId] as const,
    queryFn: userId ? () => fetchMine(userId) : skipToken,
    ...options,
  });
};

export const useAllMemberships = <T = AdminMembership[]>(options?: AllOptions<T>) => {
  const userId = useSessionUserId();
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [MEMBERSHIPS_KEY, 'all', userId] as const,
    queryFn: isAdmin ? fetchAll : skipToken,
    ...options,
  });
};

export const useCreateMembership = (options?: MutationOptions<Membership, MembershipInput>) =>
  useMutation({ mutationFn: createMembership, onSuccess: invalidateMemberships, ...options });

export const useUpdateMembership = (options?: MutationOptions<Membership, Update>) =>
  useMutation({ mutationFn: updateMembership, onSuccess: invalidateMemberships, ...options });

export const useDeleteMembership = (options?: MutationOptions<void, string>) =>
  useMutation({ mutationFn: deleteMembership, onSuccess: invalidateMemberships, ...options });

export const useRequestMembership = (options?: MutationOptions<Membership, RequestInput>) => {
  const userId = useSessionUserId();
  return useMutation({
    mutationFn: (input: RequestInput) => requestMembership(userId, input),
    onSuccess: invalidateMemberships,
    ...options,
  });
};

export const useCancelRequest = (options?: MutationOptions<void, string>) =>
  useMutation({ mutationFn: cancelRequest, onSuccess: invalidateMemberships, ...options });

const FoundProfile = z.object({ id: z.uuid(), name: z.string(), email: z.string() }).nullable();
export const findProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw toError(error);
  return FoundProfile.parse(data);
};
