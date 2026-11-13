import { getRouteApi } from '@tanstack/react-router';
import type { FC } from 'react';

import { SessionStatus } from '~/shuttlekaos/model';
import { useShuttleKaosSession } from '~/shuttlekaos/queries';

import { AddToHomeBanner } from './AddToHome';
import { SessionGate } from './Fallbacks';
import { OpenSession } from './OpenSession';
import { PlaySession } from './PlaySession';

const route = getRouteApi('/shuttlekaos/$code');

export const SessionPage: FC = () => {
  const { code } = route.useParams();
  const view = useShuttleKaosSession(code);
  return (
    <SessionGate view={view}>
      {(data) => (
        <>
          {data.session.status === SessionStatus.enum.open ? <OpenSession view={data} /> : <PlaySession view={data} />}
          {(data.isOwner || data.myPlayerId !== null) && <AddToHomeBanner />}
        </>
      )}
    </SessionGate>
  );
};
