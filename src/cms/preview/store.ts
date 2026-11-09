import type { RouterHistory } from '@tanstack/react-router';

import type { QueryOptions } from '../sanityApi';

export type PreviewListen = { id: string; query: string; params: Record<string, unknown> };

export type PreviewConfig = {
  history: RouterHistory;
  studioUrl: string;
  isLocale: (value: unknown) => boolean;
  onUpdate: () => void;
};

type Waiter = { resolve: (value: unknown) => void; reject: (reason: unknown) => void };

type Entry = PreviewListen & { result?: { value: unknown }; waiters: Set<Waiter> };

const CONNECT_TIMEOUT = 20_000;
const NO_PARAMS: Record<string, unknown> = {};

const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
let listens: PreviewListen[] = [];
let onUpdate = () => {};

export const subscribeListens = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const getListens = () => listens;

const register = (query: string, params: Record<string, unknown>) => {
  const id = JSON.stringify([query, params]);
  const existing = entries.get(id);
  if (existing) return existing;
  const entry: Entry = { id, query, params, waiters: new Set() };
  entries.set(id, entry);
  listens = Array.from(entries.values(), (e) => ({ id: e.id, query: e.query, params: e.params }));
  for (const listener of listeners) listener();
  return entry;
};

export const fetchPreview = (query: string, { params = NO_PARAMS, signal }: QueryOptions = {}) => {
  const entry = register(query, params);
  if (entry.result) return Promise.resolve(entry.result.value);
  return new Promise<unknown>((resolve, reject) => {
    const settle = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      entry.waiters.delete(waiter);
    };
    const waiter: Waiter = {
      resolve: (value) => {
        settle();
        resolve(value);
      },
      reject: (reason) => {
        settle();
        reject(reason);
      },
    };
    const abort = () => waiter.reject(signal?.reason);
    const timer = setTimeout(() => waiter.reject(new Error('The preview could not reach the Studio')), CONNECT_TIMEOUT);
    signal?.addEventListener('abort', abort);
    entry.waiters.add(waiter);
  });
};

export const receivePreview = (id: string, value: unknown) => {
  const entry = entries.get(id);
  if (!entry) return;
  entry.result = { value };
  if (entry.waiters.size === 0) {
    onUpdate();
    return;
  }
  for (const waiter of entry.waiters) waiter.resolve(value);
};

export const startPreview = async (config: PreviewConfig) => {
  onUpdate = config.onUpdate;
  (await import('./start')).mountPreview(config);
};
