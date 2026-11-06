import { redirect } from '@tanstack/react-router';

import { queryClient } from '~/cms/queryClient';
import { getSupabase } from '~/supabase/client';

import { profileQuery } from './hooks';

const isAdmin = async () => {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return false;
  const profile = await queryClient.ensureQueryData(profileQuery(userId)).catch(() => null);
  return profile?.isAdmin === true;
};

export const requireAdmin = async () => {
  if (!(await isAdmin())) throw redirect({ to: '/' });
};
