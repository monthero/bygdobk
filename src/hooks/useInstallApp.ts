import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { isAppleMobile } from '~/utils/device';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const InstallMode = z.enum(['prompt', 'ios']);
export type InstallMode = z.infer<typeof InstallMode>;

const STANDALONE = '(display-mode: standalone)';

let deferred: InstallPromptEvent | undefined;
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
  deferred = undefined;
  notify();
});

const isStandalone = () =>
  matchMedia(STANDALONE).matches || ('standalone' in navigator && navigator.standalone === true);

const modeOf = (): InstallMode | undefined => {
  if (isStandalone()) return undefined;
  if (deferred) return InstallMode.enum.prompt;
  return isAppleMobile() ? InstallMode.enum.ios : undefined;
};

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

export const useInstallApp = () => ({ mode: useSyncExternalStore(subscribe, modeOf), install });
