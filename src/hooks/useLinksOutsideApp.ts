import { useEffect } from 'react';

import { isShuttleKaosPath } from '~/utils/apps';

const openInBrowser = (event: MouseEvent) => {
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
  if (url.origin === location.origin && isShuttleKaosPath(url.pathname)) return;
  const { target, rel } = link;
  link.target = '_blank';
  link.rel = 'noopener';
  setTimeout(() => {
    link.target = target;
    link.rel = rel;
  });
};

export const useLinksOutsideApp = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;
    document.addEventListener('click', openInBrowser, true);
    return () => document.removeEventListener('click', openInBrowser, true);
  }, [enabled]);
};
