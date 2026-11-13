import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, Group, Skeleton } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { useAuthReady, useProfile, useSessionUserId } from '~/components/auth/hooks';
import { ArrowCounterClockwise, ArrowRight } from '~/components/ui';
import { LoadError } from '~/pages/board/LoadError';
import { SessionStatus, type Level, type PublicSession, type SessionSummary } from '~/shuttlekaos/model';
import { useMyActiveSessions, usePublicSessions } from '~/shuttlekaos/queries';
import type { User } from '~/stores/auth';

import { firstName } from '../labels';
import { LoginPrompt } from '../LoginPrompt';
import { NearestButton, PublicCard } from '../PublicSessions';
import { useSetupPrefs, type PrefsState } from '../setupPrefs';
import { useKaosTitle } from '../useKaosTitle';
import { HowItWorks } from './HowItWorks';
import { JoinCode } from './JoinCode';
import { PageHead } from './PageHead';
import { QuietCourt } from './QuietCourt';
import { HomeSection, SessionGrid } from './SessionCards';
import { useFreshPlayer } from './useFreshPlayer';
import { useNearestFirst } from './useNearestFirst';

import classes from './PlayPage.module.css';

const NO_LEVELS: Level[] = [];
const EMPTY_PUBLIC: PublicSession[] = [];
const EMPTY_SUMMARIES: SessionSummary[] = [];
const ROW_LIMIT = 6;
const ROW_SKELETONS = [0, 1, 2];

const selectFirstName = (user: User) => firstName(user.name);
const selectHasLineup = (s: PrefsState) => s.lineup !== null;
const selectIds = (sessions: SessionSummary[]) => new Set(sessions.map((s) => s.id));
const byStatus = (sessions: SessionSummary[]) => Map.groupBy(sessions, (s) => s.status);

const Greeting: FC = () => {
  const userId = useSessionUserId();
  const name = useProfile({ select: selectFirstName }).data;
  const hasLastSetup = useSetupPrefs(selectHasLineup);
  return (
    <PageHead
      eyebrow={
        userId && name ? (
          <Trans comment="Greeting with your first name">Hi {name}</Trans>
        ) : (
          <Trans comment="Greeting when we don't know your name">Welcome</Trans>
        )
      }
      title={<Trans>Ready for chaos?</Trans>}
    >
      {userId && hasLastSetup && (
        <Button
          variant="default"
          radius="xl"
          leftSection={<ArrowCounterClockwise />}
          renderRoot={(props) => <Link {...props} to="/shuttlekaos/ny" search={{ siste: true }} />}
        >
          <Trans>Use last setup</Trans>
        </Button>
      )}
    </PageHead>
  );
};

const MySessions: FC = () => {
  const { t } = useLingui();
  const active = useMyActiveSessions({ select: byStatus });

  if (active.isError) {
    return (
      <LoadError
        title={t`Couldn't load your sessions`}
        error={active.error}
        retrying={active.isRefetching}
        onRetry={() => void active.refetch()}
      />
    );
  }
  const running = active.data?.get(SessionStatus.enum.running) ?? EMPTY_SUMMARIES;
  const waiting = active.data?.get(SessionStatus.enum.open) ?? EMPTY_SUMMARIES;
  if (running.length === 0 && waiting.length === 0) return null;
  return (
    <div className={classes.mine}>
      {running.length > 0 && (
        <HomeSection title={<Trans comment="Heading for your sessions being played right now">Playing now</Trans>}>
          <SessionGrid summaries={running} />
        </HomeSection>
      )}
      {waiting.length > 0 && (
        <HomeSection title={<Trans comment="Heading for your sessions that haven't started">Waiting to start</Trans>}>
          <SessionGrid summaries={waiting} />
        </HomeSection>
      )}
    </div>
  );
};

const OpenSessions: FC = () => {
  const { t } = useLingui();
  const list = usePublicSessions(NO_LEVELS);
  const mine = useMyActiveSessions({ select: selectIds }).data;
  const others = useMemo(
    () => (list.data ?? EMPTY_PUBLIC).filter((session) => !mine?.has(session.id)),
    [list.data, mine],
  );
  const sort = useNearestFirst(others);
  const shown = sort.sessions.slice(0, ROW_LIMIT);

  let body;
  if (list.isPending) {
    body = (
      <div className={classes.row} aria-busy>
        {ROW_SKELETONS.map((i) => (
          <Skeleton key={i} height={210} radius="lg" />
        ))}
      </div>
    );
  } else if (list.isError) {
    body = (
      <LoadError
        title={t`Couldn't load open sessions`}
        error={list.error}
        retrying={list.isRefetching}
        onRetry={() => void list.refetch()}
      />
    );
  } else if (shown.length === 0) {
    body = <QuietCourt compact />;
  } else {
    body = (
      <div className={classes.row}>
        {shown.map((session) => (
          <PublicCard key={session.id} session={session} km={sort.distances.get(session.id)} />
        ))}
      </div>
    );
  }

  return (
    <HomeSection
      title={<Trans comment="Heading for sessions anyone can join">Public sessions</Trans>}
      action={
        shown.length > 0 && (
          <Group gap={12}>
            <NearestButton sort={sort} size="xs" />
            <Anchor
              renderRoot={(props) => <Link {...props} to="/shuttlekaos/lobby" />}
              size="sm"
              fw={700}
              className={classes.more}
            >
              <Trans comment="Link from a few open sessions to the full list">See all</Trans>
              <ArrowRight aria-hidden />
            </Anchor>
          </Group>
        )
      }
    >
      {body}
    </HomeSection>
  );
};

export const PlayPage: FC = () => {
  const { t } = useLingui();
  useKaosTitle(
    t({ message: 'Play', context: 'ShuttleKaos: play games', comment: 'Browser tab title for the ShuttleKaos home' }),
  );
  const ready = useAuthReady();
  const userId = useSessionUserId();
  const fresh = useFreshPlayer();

  return (
    <>
      <Greeting />
      {userId && <MySessions />}
      <JoinCode />
      {fresh && <HowItWorks />}
      <OpenSessions />
      {ready && !userId && (
        <LoginPrompt>
          <Trans>Log in to start or join sessions and keep your history. Watching works without it.</Trans>
        </LoginPrompt>
      )}
    </>
  );
};
