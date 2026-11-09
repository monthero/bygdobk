import type { ClientPerspective, ContentSourceMap } from '@sanity/client';
import { stegaEncodeSourceMap } from '@sanity/client/stega';
import {
  usePresentationQuery,
  VisualEditing,
  type HistoryAdapter,
  type HistoryUpdate,
} from '@sanity/visual-editing/react';
import type { RouterHistory } from '@tanstack/react-router';
import { useEffect, useMemo, useState, useSyncExternalStore, type FC } from 'react';
import { createRoot } from 'react-dom/client';

import { getListens, receivePreview, subscribeListens, type PreviewConfig, type PreviewListen } from './store';

type HistoryAction = Parameters<Parameters<RouterHistory['subscribe']>[0]>[0]['action']['type'];

const stegaFor = ({ studioUrl, isLocale }: PreviewConfig) => {
  const options = {
    enabled: true,
    studioUrl,
    filter: ({ sourcePath }: { sourcePath: readonly unknown[] }) => isLocale(sourcePath.at(-1)),
  };
  return (data: unknown, sourceMap: ContentSourceMap | null) =>
    sourceMap ? stegaEncodeSourceMap(data, sourceMap, options) : data;
};

type WithStega = ReturnType<typeof stegaFor>;

const updateType = (action: HistoryAction): HistoryUpdate['type'] => {
  if (action === 'PUSH') return 'push';
  if (action === 'REPLACE') return 'replace';
  return 'pop';
};

const historyAdapter = (history: RouterHistory): HistoryAdapter => ({
  subscribe: (navigate) => {
    navigate({ type: 'replace', url: history.location.href });
    return history.subscribe(({ location, action }) => navigate({ type: updateType(action.type), url: location.href }));
  },
  update: ({ type, url }) => {
    if (type === 'pop') return history.back();
    if (url === history.location.href) return;
    if (type === 'replace') history.replace(url);
    else history.push(url);
  },
});

const RETRY_MS = 750;

const samePerspective = (a: ClientPerspective | undefined, b: ClientPerspective | undefined) =>
  JSON.stringify(a) === JSON.stringify(b);

type ListenerProps = PreviewListen & { wanted: ClientPerspective | undefined; withStega: WithStega };

type SubscriptionProps = ListenerProps & {
  onReceive: (perspective: ClientPerspective) => void;
};

const Subscription: FC<SubscriptionProps> = ({ id, query, params, wanted, withStega, onReceive }) => {
  const { data, sourceMap, perspective } = usePresentationQuery({ query, params, stega: false });
  useEffect(() => {
    if (!perspective || (wanted !== undefined && !samePerspective(perspective, wanted))) return;
    onReceive(perspective);
    receivePreview(id, withStega(data, sourceMap));
  }, [id, data, sourceMap, perspective, wanted, withStega, onReceive]);
  return null;
};

// The hook only asks the Studio again every 20 s, so remount it until results for the current perspective arrive.
const Listener: FC<ListenerProps> = (props) => {
  const [attempt, setAttempt] = useState(0);
  const [received, setReceived] = useState<ClientPerspective>();
  const synced = received !== undefined && (props.wanted === undefined || samePerspective(received, props.wanted));
  useEffect(() => {
    if (synced) return;
    const timer = setTimeout(() => setAttempt((n) => n + 1), RETRY_MS);
    return () => clearTimeout(timer);
  }, [synced, attempt]);
  return <Subscription key={attempt} {...props} onReceive={setReceived} />;
};

const PreviewBridge: FC<{ config: PreviewConfig }> = ({ config }) => {
  const listens = useSyncExternalStore(subscribeListens, getListens);
  const [perspective, setPerspective] = useState<ClientPerspective>();
  const adapter = useMemo(() => historyAdapter(config.history), [config]);
  const withStega = useMemo(() => stegaFor(config), [config]);
  return (
    <>
      <VisualEditing portal history={adapter} onPerspectiveChange={setPerspective} />
      {listens.map((listen) => (
        <Listener key={listen.id} {...listen} wanted={perspective} withStega={withStega} />
      ))}
    </>
  );
};

export const mountPreview = (config: PreviewConfig) =>
  createRoot(document.createElement('div')).render(<PreviewBridge config={config} />);
