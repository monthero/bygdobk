import { AuthPKCECodeVerifierMissingError, type AuthError, type Session } from '@supabase/supabase-js';
import { z } from 'zod';
import { create } from 'zustand';

import { ENV } from '~/env';
import { LOCALES } from '~/i18n/locales';
import { replaceLocation } from '~/i18n/url';
import { getSupabase, type Supabase } from '~/supabase/client';

import { ColorScheme } from './settings';
import { useUi } from './ui';

export const User = z.object({
  name: z.string(),
  email: z.string(),
  isAdmin: z.boolean(),
  locale: z.enum(LOCALES).nullable().catch(null),
  colorScheme: ColorScheme.nullable().catch(null),
  avatarUrl: z.url().nullable().catch(null),
});
export type User = z.infer<typeof User>;

export interface AuthState {
  session: Session | null;
  ready: boolean;
  linkError: AuthError | null;
}

export const useAuth = create<AuthState>()(() => ({ session: null, ready: false, linkError: null }));

const AuthUrlParam = z.enum(['code', 'error', 'error_code', 'error_description']);

const authParamsInUrl = () => {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const inHash = AuthUrlParam.options.some((key) => hash.has(key));
  const inSearch = AuthUrlParam.options.some((key) => url.searchParams.has(key));
  return { url, inHash, inSearch };
};

const removeAuthParams = () => {
  const { url, inHash, inSearch } = authParamsInUrl();
  if (!inHash && !inSearch) return false;
  for (const key of AuthUrlParam.options) url.searchParams.delete(key);
  if (inHash) url.hash = '';
  replaceLocation(url.pathname + url.search + url.hash);
  return true;
};

const checkLoginLink = async (supabase: Supabase) => {
  const { error } = await supabase.auth.initialize();
  if (!removeAuthParams()) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  // A code is left in the URL when the link is opened in another browser than the one that asked for it.
  useAuth.setState({ linkError: error ?? new AuthPKCECodeVerifierMissingError() });
  useUi.getState().openLogin();
};

const SESSION_KEY = `sb-${new URL(ENV.VITE_SUPABASE_URL).hostname.split('.').at(0)}-auth-token`;

const hasStoredSession = () => {
  try {
    return localStorage.getItem(SESSION_KEY) !== null;
  } catch {
    return false;
  }
};

const hasAuthParams = () => {
  const { inHash, inSearch } = authParamsInUrl();
  return inHash || inSearch;
};

let started: Promise<void> | undefined;

export const startAuth = () =>
  (started ??= (async () => {
    const supabase = await getSupabase();
    supabase.auth.onAuthStateChange((_event, session) => {
      useAuth.setState({ session, ready: true });
      if (session) useUi.getState().closeLogin();
    });
    await checkLoginLink(supabase);
  })());

// Visitors who never logged in don't need the Supabase client until they open the login dialog.
if (hasStoredSession() || hasAuthParams()) void startAuth();
else useAuth.setState({ ready: true });
