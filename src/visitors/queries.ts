import { skipToken, useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { useIsAdmin, useSessionUserId } from '~/components/auth/hooks';
import { getSupabase } from '~/supabase/client';
import { ISO_DAY } from '~/utils/dates';

import { VisitReport, type PeriodRange } from './model';

const VISITS_KEY = 'board-visits';

type VisitsKey = readonly [typeof VISITS_KEY, string | undefined, string, string];
type VisitsOptions<T> = Omit<UseQueryOptions<VisitReport, Error, T, VisitsKey>, 'queryKey' | 'queryFn'>;

const fetchVisits = async (from: string, to: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('board_visits', { p_from: from, p_to: to });
  if (error) throw error;
  return VisitReport.parse(data);
};

export const useBoardVisits = <T = VisitReport>(range: PeriodRange, options?: VisitsOptions<T>) => {
  const userId = useSessionUserId();
  const isAdmin = useIsAdmin();
  const from = range.from.format(ISO_DAY);
  const to = range.to.format(ISO_DAY);
  return useQuery({
    queryKey: [VISITS_KEY, userId, from, to] as const,
    queryFn: isAdmin ? () => fetchVisits(from, to) : skipToken,
    ...options,
  });
};
