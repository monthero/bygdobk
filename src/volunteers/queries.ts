import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { skipToken, useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { queryClient } from '~/cms/queryClient';
import { useIsAdmin, useSessionUserId } from '~/components/auth/hooks';
import { authorColumns } from '~/memberships/model';
import { getSupabase } from '~/supabase/client';
import { PROFILE_REF_COLUMNS } from '~/supabase/profile';

import { AdminShiftVolunteer, ShiftCount, ShiftVolunteer, type ShiftCounts, type VolunteerInput } from './model';

const VOLUNTEERS_KEY = 'shift-volunteers';

const COLUMNS = [
  'id',
  'eventId:event_id',
  'shiftKey:shift_key',
  'profileId:profile_id',
  'volunteerName:volunteer_name',
  'note',
  'createdAt:created_at',
].join(', ');

const ADMIN_COLUMNS = `${COLUMNS}, ${PROFILE_REF_COLUMNS}, createdBy:created_by, ${authorColumns('creator', 'created_by')}`;

const VolunteerProblem = z.enum(['offline', 'notAllowed', 'alreadyIn', 'invalid', 'notFound', 'failed']);
type VolunteerProblem = z.infer<typeof VolunteerProblem>;

const MESSAGES: Record<VolunteerProblem, MessageDescriptor> = {
  [VolunteerProblem.enum.offline]: msg`Can't reach the server. Check your connection.`,
  [VolunteerProblem.enum.notAllowed]: msg`You can't change that shift.`,
  [VolunteerProblem.enum.alreadyIn]: msg`Already on this shift.`,
  [VolunteerProblem.enum.invalid]: msg`Some of these details don't add up. Check them and try again.`,
  [VolunteerProblem.enum.notFound]: msg`That spot is gone. Someone may have removed it.`,
  [VolunteerProblem.enum.failed]: msg`Couldn't save the shift. Try again.`,
};

const PROBLEMS: Record<string, VolunteerProblem> = {
  '': VolunteerProblem.enum.offline,
  '42501': VolunteerProblem.enum.notAllowed,
  '23505': VolunteerProblem.enum.alreadyIn,
  '22P02': VolunteerProblem.enum.invalid,
  '23502': VolunteerProblem.enum.invalid,
  '23503': VolunteerProblem.enum.invalid,
  '23514': VolunteerProblem.enum.invalid,
  PGRST116: VolunteerProblem.enum.notFound,
};

class VolunteerError extends Error {
  readonly problem: VolunteerProblem;

  constructor(problem: VolunteerProblem, cause?: unknown) {
    super(problem, { cause });
    this.problem = problem;
  }
}

export const volunteerErrorMessage = (error: unknown) =>
  MESSAGES[error instanceof VolunteerError ? error.problem : VolunteerProblem.enum.failed];

const toError = (error: { code: string }) =>
  new VolunteerError(PROBLEMS[error.code] ?? VolunteerProblem.enum.failed, error);

const ShiftCountList = z.array(ShiftCount);
const VolunteerList = z.array(ShiftVolunteer);
const AdminVolunteerList = z.array(AdminShiftVolunteer);

type CountsKey = readonly [typeof VOLUNTEERS_KEY, 'counts', string];
type MineKey = readonly [typeof VOLUNTEERS_KEY, 'mine', string, string | undefined];
type EventKey = readonly [typeof VOLUNTEERS_KEY, 'event', string, string | undefined];
type CountsOptions<T> = Omit<UseQueryOptions<ShiftCounts, Error, T, CountsKey>, 'queryKey' | 'queryFn'>;
type MineOptions<T> = Omit<UseQueryOptions<ShiftVolunteer[], Error, T, MineKey>, 'queryKey' | 'queryFn'>;
type EventOptions<T> = Omit<UseQueryOptions<AdminShiftVolunteer[], Error, T, EventKey>, 'queryKey' | 'queryFn'>;
type MutationOptions<TData, TVariables> = Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>;
type TakeShift = { eventId: string; shiftKey: string };

const fetchCounts = async (eventId: string): Promise<ShiftCounts> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .rpc('shift_counts', { p_event_id: eventId })
    .select('shiftKey:shift_key, taken');
  if (error) throw toError(error);
  return new Map(ShiftCountList.parse(data).map((c) => [c.shiftKey, c.taken]));
};

const fetchMine = async (eventId: string, userId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('shift_volunteers')
    .select(COLUMNS)
    .eq('event_id', eventId)
    .eq('profile_id', userId)
    .is('volunteer_name', null);
  if (error) throw toError(error);
  return VolunteerList.parse(data);
};

const fetchEventVolunteers = async (eventId: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('shift_volunteers')
    .select(ADMIN_COLUMNS)
    .eq('event_id', eventId)
    .order('created_at');
  if (error) throw toError(error);
  return AdminVolunteerList.parse(data);
};

const addVolunteer = async (input: VolunteerInput) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('shift_volunteers')
    .insert({
      event_id: input.eventId,
      shift_key: input.shiftKey,
      profile_id: input.profileId,
      volunteer_name: input.volunteerName,
      note: input.note,
    })
    .select(COLUMNS)
    .single();
  if (error) throw toError(error);
  return ShiftVolunteer.parse(data);
};

const removeVolunteer = async (id: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from('shift_volunteers').delete().eq('id', id).select('id');
  if (error) throw toError(error);
  if (data.length === 0) throw new VolunteerError(VolunteerProblem.enum.notFound);
};

const updateNote = async ({ id, note }: { id: string; note: string | null }) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('shift_volunteers')
    .update({ note })
    .eq('id', id)
    .select(COLUMNS)
    .single();
  if (error) throw toError(error);
  return ShiftVolunteer.parse(data);
};

const invalidateVolunteers = () => queryClient.invalidateQueries({ queryKey: [VOLUNTEERS_KEY] });

export const useShiftCounts = <T = ShiftCounts>(eventId: string, options?: CountsOptions<T>) =>
  useQuery({
    queryKey: [VOLUNTEERS_KEY, 'counts', eventId] as const,
    queryFn: () => fetchCounts(eventId),
    ...options,
  });

export const useMyShifts = <T = ShiftVolunteer[]>(eventId: string, options?: MineOptions<T>) => {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: [VOLUNTEERS_KEY, 'mine', eventId, userId] as const,
    queryFn: userId ? () => fetchMine(eventId, userId) : skipToken,
    ...options,
  });
};

export const useEventVolunteers = <T = AdminShiftVolunteer[]>(eventId: string, options?: EventOptions<T>) => {
  const userId = useSessionUserId();
  const isAdmin = useIsAdmin();
  return useQuery({
    queryKey: [VOLUNTEERS_KEY, 'event', eventId, userId] as const,
    queryFn: isAdmin && eventId ? () => fetchEventVolunteers(eventId) : skipToken,
    ...options,
  });
};

export const useTakeShift = (options?: MutationOptions<ShiftVolunteer, TakeShift>) => {
  const userId = useSessionUserId();
  return useMutation({
    mutationFn: async ({ eventId, shiftKey }: TakeShift) => {
      if (!userId) throw new VolunteerError(VolunteerProblem.enum.notAllowed);
      return addVolunteer({ eventId, shiftKey, profileId: userId, volunteerName: null, note: null });
    },
    onSettled: invalidateVolunteers,
    ...options,
  });
};

export const useAddVolunteer = (options?: MutationOptions<ShiftVolunteer, VolunteerInput>) =>
  useMutation({ mutationFn: addVolunteer, onSettled: invalidateVolunteers, ...options });

export const useRemoveVolunteer = (options?: MutationOptions<void, string>) =>
  useMutation({ mutationFn: removeVolunteer, onSettled: invalidateVolunteers, ...options });

export const useUpdateVolunteerNote = (
  options?: MutationOptions<ShiftVolunteer, { id: string; note: string | null }>,
) => useMutation({ mutationFn: updateNote, onSettled: invalidateVolunteers, ...options });
