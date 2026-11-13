import { useEffect, useSyncExternalStore } from 'react';
import { z } from 'zod';

import { AppKind, appForPath, isMarkedInstalled, markInstalled } from '~/utils/apps';
import { isAppleMobile, isFirefoxAndroid, isStandalone } from '~/utils/device';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const InstallMode = z.enum(['prompt', 'ios', 'firefox']);
export type InstallMode = z.infer<typeof InstallMode>;

const APP_HEAD: Record<AppKind, { manifest: string; title: string; icon: string }> = {
  [AppKind.enum.club]: { manifest: '/manifest.webmanifest', title: 'Bygdø BK', icon: '/apple-touch-icon.png' },
  [AppKind.enum.shuttlekaos]: {
    manifest: '/shuttlekaos.webmanifest',
    title: 'ShuttleKaos',
    icon: '/shuttlekaos-apple-touch-icon.png',
  },
};

let deferred: InstallPromptEvent | undefined;
let shownApp: AppKind = AppKind.enum.club;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

const isInstallPrompt = (event: Event): event is InstallPromptEvent => 'prompt' in event;

addEventListener('beforeinstallprompt', (event) => {
  if (!isInstallPrompt(event)) return;
  deferred = event;
  notify();
});

addEventListener('appinstalled', () => {
  markInstalled(shownApp);
  deferred = undefined;
  notify();
});

const showApp = (app: AppKind) => {
  if (app === shownApp) return;
  shownApp = app;
  const { manifest, title, icon } = APP_HEAD[app];
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', manifest);
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', icon);
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', title);
  deferred = undefined;
  notify();
};

showApp(appForPath(location.pathname));

export const useAppManifest = (app: AppKind) => {
  useEffect(() => showApp(app), [app]);
};

const modeOf = (): InstallMode | undefined => {
  if (isStandalone()) return undefined;
  if (deferred) return InstallMode.enum.prompt;
  if (isMarkedInstalled(shownApp)) return undefined;
  if (isAppleMobile()) return InstallMode.enum.ios;
  return isFirefoxAndroid() ? InstallMode.enum.firefox : undefined;
};

const appOf = () => shownApp;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const install = async () => {
  const event = deferred;
  if (!event) return;
  deferred = undefined;
  try {
    await event.prompt();
    await event.userChoice;
  } finally {
    notify();
  }
};

export const useInstallApp = () => ({
  mode: useSyncExternalStore(subscribe, modeOf),
  app: useSyncExternalStore(subscribe, appOf),
  install,
});
