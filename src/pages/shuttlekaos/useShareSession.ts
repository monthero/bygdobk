import { useLingui } from '@lingui/react/macro';

import { notifyDone, notifyFailed } from '~/pages/board/format';

import { sessionUrl } from './labels';

const CAN_SHARE = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export const useShareSession = () => {
  const { t } = useLingui();
  return (code: string, title: string) => {
    const url = sessionUrl(code);
    if (CAN_SHARE) {
      void navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => notifyDone(t`Link copied. Anyone with it can follow along.`),
      () => notifyFailed(t`Could not copy the link`),
    );
  };
};
