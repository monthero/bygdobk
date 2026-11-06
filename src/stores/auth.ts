import { AuthPKCECodeVerifierMissingError, type AuthError, type Session } from '@supabase/supabase-js';
import { z } from 'zod';
import { create } from 'zustand';

import { LOCALES } from '~/i18n/locales';
import { replaceLocation } from '~/i18n/url';
import { supabase } from '~/supabase/client';

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

const removeAuthParams = () => {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const inHash = AuthUrlParam.options.some((key) => hash.has(key));
  const inSearch = AuthUrlParam.options.some((key) => url.searchParams.has(key));
  if (!inHash && !inSearch) return false;
  for (const key of AuthUrlParam.options) url.searchParams.delete(key);
  if (inHash) url.hash = '';
  replaceLocation(url.pathname + url.search + url.hash);
  return true;
};

const checkLoginLink = async () => {
  const { error } = await supabase.auth.initialize();
  if (!removeAuthParams()) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  // A code is left in the URL when the link is opened in another browser than the one that asked for it.
  useAuth.setState({ linkError: error ?? new AuthPKCECodeVerifierMissingError() });
  useUi.getState().openLogin();
};

supabase.auth.onAuthStateChange((_event, session) => {
  useAuth.setState({ session, ready: true });
  if (session) useUi.getState().closeLogin();
});

void checkLoginLink();
