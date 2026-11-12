import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, Paper, Progress, Stack, Text } from '@mantine/core';
import type { FC, Ref } from 'react';

import { CaretLeft, CaretRight, Coffee, ListNumbers } from '~/components/ui';
import { isRoundComplete, pairCoverage, roundsLeft } from '~/shuttlekaos/engine';
import { EVERYONE_ONCE, SessionStatus, type Game, type Session } from '~/shuttlekaos/model';

import { CourtCard } from './CourtCard';
import { LiveBadge } from './Fallbacks';
import { isMe, playersOf, type PlayerMap } from './labels';
import { PlayerAvatar } from './People';

import classes from './RoundBrowser.module.css';

const PERCENT = 100;

const ProgressLine: FC<{ session: Session }> = ({ session }) => {
  const { t } = useLingui();
  const { rounds } = session.settings;
  if (rounds === EVERYONE_ONCE) {
    const { covered, total } = pairCoverage(session);
    if (total === 0) return null;
    return (
      <Stack gap={4}>
        <Progress
          value={(covered / total) * PERCENT}
          size="sm"
          radius="xl"
          color="brand"
          aria-label={t`Pairings played`}
        />
        <Text size="xs" c="dimmed" className={classes.progressText}>
          <Trans comment="Progress toward everyone having played together, e.g. 12 of 36 pairings played">
            {covered} of {total} pairings played
          </Trans>
        </Text>
      </Stack>
    );
  }
  if (rounds === null) return null;
  const done = session.rounds.filter((r) => isRoundComplete(session, r.number)).length;
  return (
    <Stack gap={4}>
      <Progress value={(done / rounds) * PERCENT} size="sm" radius="xl" color="brand" aria-label={t`Rounds played`} />
      <Text size="xs" c="dimmed" className={classes.progressText}>
        <Trans>
          {done} of {rounds} rounds played
        </Trans>
      </Text>
    </Stack>
  );
};

type NavProps = {
  session: Session;
  viewed: number;
  onView: (round: number) => void;
  compact?: boolean;
  onStandings?: () => void;
};

export const RoundNav: FC<NavProps> = ({ session, viewed, onView, compact, onStandings }) => {
  const { t } = useLingui();
  const last = session.rounds.at(-1)?.number ?? 0;
  const live = session.status === SessionStatus.enum.running && viewed === last;
  const limit = session.settings.rounds;
  const previous = viewed - 1;
  const next = viewed + 1;

  let total = last;
  if (limit === EVERYONE_ONCE && session.status === SessionStatus.enum.running) {
    total = last + (roundsLeft(session) ?? 0);
  } else if (typeof limit === 'number') total = limit;

  return (
    <div className={classes.navBox} data-compact={compact || undefined}>
      <div className={classes.nav}>
        <ActionIcon
          variant="light"
          color="brand"
          radius="xl"
          size={compact ? 34 : 44}
          className={classes.arrow}
          aria-label={t`Round ${previous}`}
          disabled={viewed <= 1}
          data-hidden={viewed <= 1 || undefined}
          onClick={() => onView(previous)}
        >
          <CaretLeft />
        </ActionIcon>
        <div className={classes.label}>
          <Text fw={800} className={classes.round}>
            <Trans comment="Round being shown and the planned total, e.g. Round 3 / 11">
              Round {viewed} / {total}
            </Trans>
          </Text>
          {live && (
            <LiveBadge>
              <Trans comment="Marks the round being played right now">Live</Trans>
            </LiveBadge>
          )}
        </div>
        <ActionIcon
          variant="light"
          color="brand"
          radius="xl"
          size={compact ? 34 : 44}
          className={classes.arrow}
          aria-label={t`Round ${next}`}
          disabled={viewed >= last}
          data-hidden={viewed >= last || undefined}
          onClick={() => onView(next)}
        >
          <CaretRight />
        </ActionIcon>
      </div>
      <div className={classes.foot}>
        <div className={classes.progress}>
          <ProgressLine session={session} />
        </div>
        {onStandings && (
          <Button
            variant="light"
            size={compact ? 'compact-sm' : 'compact-md'}
            h={compact ? 32 : 36}
            leftSection={<ListNumbers />}
            onClick={onStandings}
          >
            <Trans>Standings</Trans>
          </Button>
        )}
      </div>
    </div>
  );
};

type Props = {
  session: Session;
  players: PlayerMap;
  viewed: number;
  onView: (round: number) => void;
  onScore?: (matchId: string, games: Game[]) => void;
  onEdit?: (matchId: string) => void;
  onStandings?: () => void;
  headRef?: Ref<HTMLDivElement>;
};

export const RoundBrowser: FC<Props> = ({
  session,
  players,
  viewed,
  onView,
  onScore,
  onEdit,
  onStandings,
  headRef,
}) => {
  const round = session.rounds.find((r) => r.number === viewed);
  const resting = round ? playersOf(players, round.resting) : [];

  return (
    <Stack gap="md">
      <Paper ref={headRef} withBorder radius="lg" p="sm" className={classes.head}>
        <RoundNav session={session} viewed={viewed} onView={onView} onStandings={onStandings} />
      </Paper>
      {round && round.resting.length > 0 && (
        <Paper radius="lg" p="sm" className={classes.resting}>
          <Coffee aria-hidden className={classes.restingIcon} />
          <Text size="sm" c="dimmed">
            <Trans comment="Followed by the players who sit out this round">Resting this round</Trans>
          </Text>
          <ul className={classes.restingPlayers}>
            {resting.map((player) => (
              <li key={player.id} className={classes.restingPlayer}>
                <PlayerAvatar player={player} size={26} />
                <Text fw={isMe(player) ? 800 : 700} size="sm">
                  {player.name}
                </Text>
              </li>
            ))}
          </ul>
        </Paper>
      )}
      {round && (
        <div className={classes.courts}>
          {round.matches.map((match) => (
            <CourtCard
              key={match.id}
              match={match}
              settings={session.settings}
              players={players}
              onScore={onScore}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </Stack>
  );
};
