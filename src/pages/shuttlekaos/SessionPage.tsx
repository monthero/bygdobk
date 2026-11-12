import { Trans, useLingui } from '@lingui/react/macro';
import { Container } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import type { FC } from 'react';

import { LoadError } from '~/pages/board/LoadError';
import { SessionStatus } from '~/shuttlekaos/model';
import { useShuttleKaosSession } from '~/shuttlekaos/queries';

import { EmptySession, SessionSkeleton } from './Fallbacks';
import { OpenSession } from './OpenSession';
import { PlaySession } from './PlaySession';

const route = getRouteApi('/shuttlekaos/$code');

export const SessionPage: FC = () => {
  const { t } = useLingui();
  const { code } = route.useParams();
  const view = useShuttleKaosSession(code);

  if (view.isPending) return <SessionSkeleton />;
  if (view.isError) {
    return (
      <Container py="xl">
        <LoadError
          title={t`Couldn't load this session`}
          error={view.error}
          retrying={view.isRefetching}
          onRetry={() => void view.refetch()}
        />
      </Container>
    );
  }
  if (!view.data) {
    return (
      <EmptySession
        title={<Trans>This session doesn't exist anymore</Trans>}
        text={<Trans>The organizer may have deleted it. Start your own instead!</Trans>}
      />
    );
  }
  return view.data.session.status === SessionStatus.enum.open ? (
    <OpenSession view={view.data} />
  ) : (
    <PlaySession view={view.data} />
  );
};
