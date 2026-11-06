import { skipToken, useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { ENV } from '~/env';
import { useAuth, User, type AuthState } from '~/stores/auth';
import { getSupabase } from '~/supabase/client';

const PROFILE_KEY = 'profile';
const AUTH_SETTINGS_KEY = 'auth-settings';
const AUTH_SETTINGS_STALE_MS = 10 * 60_000;

type ProfileKey = readonly [typeof PROFILE_KEY, string | undefined];
type ProfileOptions<T> = Omit<UseQueryOptions<User, Error, T, ProfileKey>, 'queryKey' | 'queryFn'>;

const AuthSettings = z.object({ external: z.object({ google: z.boolean() }) });
type AuthSettings = z.infer<typeof AuthSettings>;
type AuthSettingsOptions = Omit<UseQueryOptions<AuthSettings>, 'queryKey' | 'queryFn'>;

const selectUserId = (s: AuthState) => s.session?.user.id;
const selectEmail = (s: AuthState) => s.session?.user.email;
const selectReady = (s: AuthState) => s.ready;
const selectSignedOut = (s: AuthState) => s.ready && !s.session;
const selectIsAdmin = (user: User) => user.isAdmin;

const fetchProfile = async (id: string) => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('name, email, isAdmin:is_admin, locale, colorScheme:color_scheme, avatarUrl:avatar_url')
    .eq('id', id)
    .single();
  if (error) throw error;
  return User.parse(data);
};

const fetchAuthSettings = async () => {
  const response = await fetch(`${ENV.VITE_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: ENV.VITE_SUPABASE_PUBLISHABLE_KEY },
  });
  if (!response.ok) throw new Error(`Auth settings failed with ${response.status}`);
  return AuthSettings.parse(await response.json());
};

export const profileKey = (userId: string | undefined): ProfileKey => [PROFILE_KEY, userId];

export const profileQuery = (userId: string) => ({
  queryKey: profileKey(userId),
  queryFn: () => fetchProfile(userId),
});

export const useSessionUserId = () => useAuth(selectUserId);

export const useSessionEmail = () => useAuth(selectEmail);

export const useAuthReady = () => useAuth(selectReady);

export const useSignedOut = () => useAuth(selectSignedOut);

export const useProfile = <T = User>(options?: ProfileOptions<T>) => {
  const userId = useSessionUserId();
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: userId ? () => fetchProfile(userId) : skipToken,
    ...options,
  });
};

export const useAuthSettings = (options?: AuthSettingsOptions) =>
  useQuery({
    queryKey: [AUTH_SETTINGS_KEY],
    queryFn: fetchAuthSettings,
    staleTime: AUTH_SETTINGS_STALE_MS,
    ...options,
  });

export const useUser = () => {
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const { data, isPending } = useProfile();
  return { user: data ?? null, loading: !ready || (userId !== undefined && isPending) };
};

export const useIsAdmin = () => useProfile({ select: selectIsAdmin }).data === true;
