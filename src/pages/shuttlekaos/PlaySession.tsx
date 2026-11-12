import { Plural, Trans } from '@lingui/react/macro';
import { Alert, Button, CloseButton, Group, Text } from '@mantine/core';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';

import { ArrowRight, FlagCheckered, Play, Trophy } from '~/components/ui';
import { numberFormat } from '~/i18n/current';
import {
  addRound,
  canAddRound,
  finishSession,
  gamesProblem,
  isRoundComplete,
  roundsLeft,
  setScore,
} from '~/shuttlekaos/engine';
import { SessionStatus, type Game, type Match, type Session } from '~/shuttlekaos/model';
import type { SessionView as SessionData } from '~/shuttlekaos/queries';
import { SESSION_IDLE_MINUTES } from '~/shuttlekaos/store';

import { LiveBadge } from './Fallbacks';
import { StickyBar } from './FormParts';
import { endedAutomatically, playerMap, resume, shownSession } from './labels';
import { RoundDone } from './RoundDone';
import { ScoreSheet } from './ScoreSheet';
import { SessionMenu } from './SessionMenu';
import { SessionView } from './SessionView';
import { ShareButton } from './ShareButton';
import { useSessionSave } from './useSessionSave';

const HOURS_PER_MINUTE = 1 / 60;
const IDLE_HOURS: Intl.NumberFormatOptions = { style: 'unit', unit: 'hour', unitDisplay: 'long' };
const EMPTY_MATCHES: Match[] = [];

const lastDoneRound = (session: Session) =>
  session.rounds.findLast((r) => isRoundComplete(session, r.number))?.number ?? 0;

const openCourts = (session: Session) =>
  (session.rounds.at(-1)?.matches ?? EMPTY_MATCHES).filter((m) => gamesProblem(session.settings, m.games) !== null)
    .length;

const AutoEndedNotice: FC<{ onResume: () => void; pending: boolean }> = ({ onResume, pending }) => {
  const idle = numberFormat(IDLE_HOURS).format(SESSION_IDLE_MINUTES * HOURS_PER_MINUTE);
  return (
    <Alert color="yellow" variant="light" icon={<FlagCheckered />}>
      <Group justify="space-between" gap="sm">
        <Text size="sm" flex={1} miw="16ch">
          <Trans>This session ended by itself after {idle} without new scores.</Trans>
        </Text>
        <Button size="sm" variant="white" color="dark" leftSection={<Play />} loading={pending} onClick={onResume}>
          <Trans>Keep playing</Trans>
        </Button>
      </Group>
    </Alert>
  );
};

const RoundDoneBanner: FC<{ round: number; onOpen: () => void; onDismiss: () => void }> = ({
  round,
  onOpen,
  onDismiss,
}) => (
  <Alert color="teal" variant="light" icon={<Trophy />} withCloseButton={false}>
    <Group justify="space-between" gap="xs" wrap="nowrap">
      <Button variant="subtle" color="teal" size="compact-md" h={44} rightSection={<ArrowRight />} onClick={onOpen}>
        <Trans>Round {round} done – see standings</Trans>
      </Button>
      <CloseButton onClick={onDismiss} />
    </Group>
  </Alert>
);

const RoundBar: FC<{ session: Session; pending: boolean; onNext: () => void; onFinish: () => void }> = ({
  session,
  pending,
  onNext,
  onFinish,
}) => {
  const left = openCourts(session);
  const lastPlanned = roundsLeft(session) === 0;

  let reason = null;
  if (left > 0) {
    reason = <Plural value={left} one="# court still needs a score." other="# courts still need a score." />;
  } else if (lastPlanned) reason = <Trans>That was the last round. Time for the results!</Trans>;

  return (
    <StickyBar reason={reason}>
      {lastPlanned ? (
        <Button
          size="lg"
          fullWidth
          leftSection={<FlagCheckered />}
          disabled={left > 0}
          loading={pending}
          onClick={onFinish}
        >
          <Trans>Finish session</Trans>
        </Button>
      ) : (
        <Button
          size="lg"
          fullWidth
          rightSection={<ArrowRight />}
          disabled={!canAddRound(session)}
          loading={pending}
          onClick={onNext}
        >
          <Trans>Next round</Trans>
        </Button>
      )}
    </StickyBar>
  );
};

export const PlaySession: FC<{ view: SessionData }> = ({ view }) => {
  const { isOwner, myPlayerId, shareCode, session: stored } = view;
  const save = useSessionSave();
  const session = shownSession(stored);
  const players = useMemo(() => playerMap(session.players), [session.players]);
  const running = session.status === SessionStatus.enum.running;
  const [editing, setEditing] = useState<string | null>(null);
  const [doneRound, setDoneRound] = useState<number | null>(null);
  const latestDone = lastDoneRound(session);
  const [seenRound, setSeenRound] = useState(latestDone);
  const autoFinished = useRef(false);

  useEffect(() => {
    if (!isOwner || session === stored || autoFinished.current) return;
    autoFinished.current = true;
    save.mutate(session);
  }, [isOwner, session, stored, save]);

  const match = editing ? session.rounds.flatMap((r) => r.matches).find((m) => m.id === editing) : undefined;

  const saveScore = (games: Game[]) => {
    if (!editing) return;
    const round = session.rounds.at(-1);
    const next = setScore(session, editing, games);
    save.mutate(next);
    setEditing(null);
    if (round && !isRoundComplete(session, round.number) && isRoundComplete(next, round.number)) {
      setDoneRound(round.number);
      setSeenRound(round.number);
    }
  };

  const next = () => {
    save.mutate(addRound(session), { onSuccess: () => setDoneRound(null) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = () => {
    save.mutate(finishSession(session), { onSuccess: () => setDoneRound(null) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showBanner = !isOwner && running && latestDone > seenRound && doneRound === null;

  return (
    <>
      <SessionView
        session={session}
        highlight={myPlayerId}
        onEdit={isOwner && running ? setEditing : undefined}
        actions={
          <>
            {!isOwner && running && <LiveBadge />}
            <ShareButton code={shareCode} title={session.title} />
            <SessionMenu view={view} hasOpenCourts={openCourts(session) > 0} onEnd={isOwner ? finish : undefined} />
          </>
        }
        notice={
          <>
            {isOwner && !running && endedAutomatically(session) && (
              <AutoEndedNotice pending={save.isPending} onResume={() => save.mutate(resume(session))} />
            )}
            {showBanner && (
              <RoundDoneBanner
                round={latestDone}
                onOpen={() => setDoneRound(latestDone)}
                onDismiss={() => setSeenRound(latestDone)}
              />
            )}
          </>
        }
        footer={
          isOwner && running && <RoundBar session={session} pending={save.isPending} onNext={next} onFinish={finish} />
        }
      />

      {match && (
        <ScoreSheet
          key={match.id}
          settings={session.settings}
          match={match}
          players={players}
          onSave={saveScore}
          onClose={() => setEditing(null)}
        />
      )}

      {doneRound !== null && (
        <RoundDone
          session={session}
          round={doneRound}
          players={players}
          last={roundsLeft(session) === 0}
          pending={save.isPending}
          onNext={isOwner && running ? next : undefined}
          onFinish={isOwner && running ? finish : undefined}
          onClose={() => {
            setDoneRound(null);
            setSeenRound(latestDone);
          }}
        />
      )}
    </>
  );
};
