import type { RouterHistory } from '@tanstack/react-router';

import { ADMIN_PATH, isAdminPath, isLocale } from '~/i18n/locales';

import { queryClient } from '../queryClient';

const inStudioFrame = () => {
  if (window.parent === window) return false;
  try {
    return isAdminPath(window.parent.location.pathname);
  } catch {
    return false;
  }
};

export const IS_PREVIEW = inStudioFrame();

export const CONTENT_SCOPE = IS_PREVIEW ? 'preview' : 'published';

// The lazy preview code gets app modules from here, so it shares no chunk with the public startup bundle.
export const startPreview = async (history: RouterHistory) =>
  (await import('./store')).startPreview({
    history,
    studioUrl: ADMIN_PATH,
    isLocale,
    onUpdate: () => void queryClient.invalidateQueries({ queryKey: [CONTENT_SCOPE] }),
  });
