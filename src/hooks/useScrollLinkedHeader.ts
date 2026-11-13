import { useEffect } from 'react';

const OFFSET_VAR = '--bk-header-offset';
const SNAP_ATTR = 'headerSnap';
const SETTLE_MS = 120;

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

export const useScrollLinkedHeader = (enabled: boolean, height: number) => {
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.style.removeProperty(OFFSET_VAR);
      return;
    }

    let offset = 0;
    let lastY = Math.max(window.scrollY, 0);
    let frame = 0;
    let settle = 0;

    const apply = (snap: boolean) => {
      if (snap) root.dataset[SNAP_ATTR] = '';
      else delete root.dataset[SNAP_ATTR];
      root.style.setProperty(OFFSET_VAR, `${offset}px`);
    };

    const snapToEdge = () => {
      const y = Math.max(window.scrollY, 0);
      offset = y < height || offset < height / 2 ? 0 : height;
      apply(true);
    };

    const onFrame = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      offset = y <= 0 ? 0 : clamp(offset + y - lastY, height);
      lastY = y;
      apply(false);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(onFrame);
      window.clearTimeout(settle);
      settle = window.setTimeout(snapToEdge, SETTLE_MS);
    };

    apply(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      delete root.dataset[SNAP_ATTR];
      root.style.removeProperty(OFFSET_VAR);
    };
  }, [enabled, height]);
};
