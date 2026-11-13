import { Trans, useLingui } from '@lingui/react/macro';
import type { FC } from 'react';

import { usePageTitle } from '~/hooks/usePageTitle';

import { BRAND } from '../labels';
import { PublicSessions } from '../PublicSessions';
import { PageHead } from './PageHead';

export const LobbyPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(
    t({ message: 'Lobby', comment: 'Browser tab title for the list of public ShuttleKaos sessions' }),
    BRAND,
  );
  return (
    <>
      <PageHead
        title={<Trans comment="Page title: public sessions anyone can join or watch">Lobby</Trans>}
        sub={<Trans>Public sessions anyone can join. Jump in or watch the scores live.</Trans>}
      />
      <PublicSessions />
    </>
  );
};
