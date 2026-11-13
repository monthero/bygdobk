import { Trans, useLingui } from '@lingui/react/macro';
import type { FC } from 'react';

import { PublicSessions } from '../PublicSessions';
import { useKaosTitle } from '../useKaosTitle';
import { PageHead } from './PageHead';

export const LobbyPage: FC = () => {
  const { t } = useLingui();
  useKaosTitle(t({ message: 'Lobby', comment: 'Browser tab title for the list of public ShuttleKaos sessions' }));
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
