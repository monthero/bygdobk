import { z } from 'zod';

import { stripLocale } from '~/i18n/locales';
import { safeLocalStorage } from '~/stores/persistence';

import { isStandalone } from './device';

export const AppKind = z.enum(['club', 'shuttlekaos']);
export type AppKind = z.infer<typeof AppKind>;

const SHUTTLEKAOS_PATH = '/shuttlekaos';
const LAUNCHED_KEY = 'bygdo-launched-app';

export const isShuttleKaosPath = (pathname: string) => {
  const bare = stripLocale(pathname);
  return bare === SHUTTLEKAOS_PATH || bare.startsWith(`${SHUTTLEKAOS_PATH}/`);
};

export const selectIsShuttleKaos = (state: { location: { pathname: string } }) =>
  isShuttleKaosPath(state.location.pathname);

export const appForPath = (pathname: string) =>
  isShuttleKaosPath(pathname) ? AppKind.enum.shuttlekaos : AppKind.enum.club;

// Both manifests use scope "/", so the page a window opened on tells which app it is.
const launchedApp = () => {
  if (!isStandalone()) return undefined;
  const launched = appForPath(location.pathname);
  try {
    const stored = AppKind.safeParse(sessionStorage.getItem(LAUNCHED_KEY));
    if (stored.success) return stored.data;
    sessionStorage.setItem(LAUNCHED_KEY, launched);
  } catch {
    return launched;
  }
  return launched;
};

const installedKey = (app: AppKind) => `bygdo-installed-${app}`;

const installed = new Set(AppKind.options.filter((app) => safeLocalStorage.getItem(installedKey(app)) !== null));

export const markInstalled = (app: AppKind) => {
  installed.add(app);
  safeLocalStorage.setItem(installedKey(app), '1');
};

export const isMarkedInstalled = (app: AppKind) => installed.has(app);

export const INSTALLED_APP = launchedApp();

if (INSTALLED_APP) markInstalled(INSTALLED_APP);
