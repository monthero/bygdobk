import { useLingui } from '@lingui/react';
import { useRouterState, type RouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';

import { useAuthReady, useProfile, useSessionUserId } from '~/components/auth/hooks';
import { ENV } from '~/env';
import { ADMIN_PATH, DEFAULT_LOCALE, isLocale, type Locale } from '~/i18n/locales';

import { VisitDevice } from './model';

const ENABLED = !import.meta.env.DEV && !navigator.webdriver;
const SKIPPED = [ADMIN_PATH, '/styret', '/studie'];
const MAX_PATH = 200;
const PHONE_MAX_SIDE = 600;
const RPC_URL = `${ENV.VITE_SUPABASE_URL}/rest/v1/rpc/record_page_view`;

const isSkipped = (path: string) => SKIPPED.some((p) => path === p || path.startsWith(`${p}/`));

const selectPath = (s: RouterState) => {
  if (s.status !== 'idle' || !s.resolvedLocation) return undefined;
  if (s.matches.some(({ _notFound, status }) => _notFound || status === 'notFound')) return undefined;
  return s.resolvedLocation.pathname;
};

const deviceOf = () => {
  if (Math.min(screen.width, screen.height) < PHONE_MAX_SIDE) return VisitDevice.enum.phone;
  return matchMedia('(pointer: coarse)').matches ? VisitDevice.enum.tablet : VisitDevice.enum.computer;
};

const referrerHost = () => {
  try {
    const { hostname } = new URL(document.referrer);
    return hostname === location.hostname ? '' : hostname;
  } catch {
    return '';
  }
};

let firstReferrer: string | undefined = referrerHost();

const send = (pathname: string, language: Locale) => {
  const path = new URL(location.origin + pathname).pathname.replace(/\/+$/, '') || '/';
  if (path.length > MAX_PATH) return;
  const referrer = firstReferrer ?? '';
  firstReferrer = undefined;
  void fetch(RPC_URL, {
    method: 'POST',
    keepalive: true,
    headers: { apikey: ENV.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_path: path,
      p_language: language,
      p_device: deviceOf(),
      p_referrer_host: referrer,
    }),
  }).catch(() => undefined);
};

export const usePageViews = () => {
  const path = useRouterState({ select: selectPath });
  const authReady = useAuthReady();
  const userId = useSessionUserId();
  const profile = useProfile();
  const known = authReady && (userId === undefined || !profile.isPending);
  const isAdmin = profile.data?.isAdmin === true;
  const saved = profile.data?.locale;
  const { i18n } = useLingui();
  const locale = isLocale(i18n.locale) ? i18n.locale : DEFAULT_LOCALE;
  const last = useRef<string>(undefined);

  useEffect(() => {
    if (!path || !known || path === last.current) return;
    if (last.current === undefined && saved && saved !== locale) return;
    last.current = path;
    if (ENABLED && !isAdmin && !isSkipped(path)) send(path, locale);
  }, [path, known, isAdmin, saved, locale]);
};
