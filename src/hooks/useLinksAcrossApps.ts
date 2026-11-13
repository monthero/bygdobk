import { useEffect } from 'react';

import { appForPath, type AppKind } from '~/utils/apps';

const linkedApp = (url: URL) => (url.origin === location.origin ? appForPath(url.pathname) : null);

const opener = (current: AppKind, externalToo: boolean) => (event: MouseEvent) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
  if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (!url.protocol.startsWith('http')) return;
  const app = linkedApp(url);
  if (app === current || (app === null && !externalToo)) return;
  const { target, rel } = link;
  link.target = '_blank';
  link.rel = 'noopener';
  setTimeout(() => {
    link.target = target;
    link.rel = rel;
  });
};

export const useLinksAcrossApps = (current: AppKind, externalToo: boolean) => {
  useEffect(() => {
    const open = opener(current, externalToo);
    document.addEventListener('click', open, true);
    return () => document.removeEventListener('click', open, true);
  }, [current, externalToo]);
};
