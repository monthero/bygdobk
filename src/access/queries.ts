import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { skipToken, useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { queryClient } from '~/cms/queryClient';
import { useIsAdmin, useSessionUserId } from '~/components/auth/hooks';
import { BoardProfile } from '~/memberships/model';
import { getSupabase } from '~/supabase/client';

const ADMINS_KEY = 'board-admins';

const PROFILE_COLUMNS = 'id, name, email, avatarUrl:avatar_url';
const ADMIN_COLUMNS = `${PROFILE_COLUMNS}, adminSince:admin_since, grantedByName:granted_by_name, grantedByEmail:granted_by_email`;

const AdminRow = BoardProfile.extend({
  adminSince: z.iso.datetime({ offset: true }).nullable(),
  grantedByName: z.string().nullable(),
  grantedByEmail: z.string().nullable(),
}).transform(({ grantedByName, grantedByEmail, ...rest }) => ({
  ...rest,
  grantedBy: grantedByName === null ? null : { name: grantedByName, email: grantedByEmail ?? '' },
}));
export type BoardAdmin = z.infer<typeof AdminRow>;

const AdminList = z.array(AdminRow);

const AccessProblem = z.enum(['offline', 'notAllowed', 'noAccount', 'self', 'lastAdmin', 'failed']);
type AccessProblem = z.infer<typeof AccessProblem>;

const MESSAGES: Record<AccessProblem, MessageDescriptor> = {
  [AccessProblem.enum.offline]: msg`Can't reach the server. Check your connection.`,
  [AccessProblem.enum.notAllowed]: msg`Only admins can change board access.`,
  [AccessProblem.enum.noAccount]: msg`No account with this email yet. Ask them to log in once first.`,
  [AccessProblem.enum.self]: msg`You can't remove yourself. Ask another admin to do it.`,
  [AccessProblem.enum.lastAdmin]: msg`You're the only admin. Add another admin first.`,
  [AccessProblem.enum.failed]: msg`Couldn't save. Try again.`,
};

const PROBLEMS: Record<string, AccessProblem> = {
  '': AccessProblem.enum.offline,
  '42501': AccessProblem.enum.notAllowed,
  BA001: AccessProblem.enum.noAccount,
  BA002: AccessProblem.enum.self,
  BA003: AccessProblem.enum.lastAdmin,
};

class AccessError extends Error {
  readonly problem: AccessProblem;

  constructor(problem: AccessProblem, cause?: unknown) {
    super(problem, { cause });
    this.problem = problem;
  }
}

export const SELF_REASON = MESSAGES[AccessProblem.enum.self];
export const LAST_ADMIN_REASON = MESSAGES[AccessProblem.enum.lastAdmin];

export const accessErrorMessage = (error: unknown) =>
  MESSAGES[error instanceof AccessError ? error.problem : AccessProblem.enum.failed];

const toError = (error: { code: string }) => new AccessError(PROBLEMS[error.code] ?? AccessProblem.enum.failed, error);

type AdminsKey = readonly [typeof ADMINS_KEY, string | undefined];
type AdminsOptions<T> = Omit<UseQueryOptions<BoardAdmin[], Error, T, AdminsKey>, 'queryKey' | 'queryFn'>;
type MutationOptions<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;

const fetchAdmins = async () => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('board_admins').select(ADMIN_COLUMNS);
  if (error) throw toError(error);
  return AdminList.parse(data);
};

const grantAdmin = async (email: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('grant_admin', { p_email: email }).select(PROFILE_COLUMNS).single();
  if (error) throw toError(error);
  return BoardProfile.parse(data);
};

const revokeAdmin = async (profileId: string) => {
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('revoke_admin', { p_profile_id: profileId });
  if (error) throw toError(error);
};

const invalidateAdmins = () => queryClient.invalidateQueries({ queryKey: [ADMINS_KEY] });

export const useBoardAdmins = <T = BoardAdmin[]>(options?: AdminsOptions<T>) => {
  const userId = useSessionUserId();
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [ADMINS_KEY, userId] as const,
    queryFn: isAdmin ? fetchAdmins : skipToken,
    ...options,
  });
};

export const useGrantAdmin = (options?: MutationOptions<BoardProfile, string>) =>
  useMutation({ mutationFn: grantAdmin, onSettled: invalidateAdmins, ...options });

export const useRevokeAdmin = (options?: MutationOptions<void, string>) =>
  useMutation({ mutationFn: revokeAdmin, onSettled: invalidateAdmins, ...options });
