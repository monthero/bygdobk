import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Badge, Paper, Progress, Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import { CaretLeft, CaretRight, Coffee } from '~/components/ui';
import { isRoundComplete, pairCoverage, roundsLeft } from '~/shuttlekaos/engine';
import { EVERYONE_ONCE, SessionStatus, type Game, type Session } from '~/shuttlekaos/model';

import { CourtCard } from './CourtCard';
import { namesOf, playersOf, type PlayerMap } from './labels';

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
        <Text size="xs" c="dimmed">
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
      <Text size="xs" c="dimmed">
        <Trans>
          {done} of {rounds} rounds played
        </Trans>
      </Text>
    </Stack>
  );
};

type Props = {
  session: Session;
  players: PlayerMap;
  viewed: number;
  onView: (round: number) => void;
  onScore?: (matchId: string, games: Game[]) => void;
  onEdit?: (matchId: string) => void;
};

export const RoundBrowser: FC<Props> = ({ session, players, viewed, onView, onScore, onEdit }) => {
  const { t } = useLingui();
  const last = session.rounds.at(-1)?.number ?? 0;
  const round = session.rounds.find((r) => r.number === viewed);
  const live = session.status === SessionStatus.enum.running && viewed === last;
  const limit = session.settings.rounds;
  const rough = last + (roundsLeft(session) ?? 0);
  const resting = round ? namesOf(playersOf(players, round.resting)) : '';
  const previous = viewed - 1;
  const next = viewed + 1;

  let label;
  if (limit === EVERYONE_ONCE && session.status === SessionStatus.enum.running) {
    label = (
      <Trans comment="The total is an estimate, e.g. Round 3 / ~11">
        Round {viewed} / ~{rough}
      </Trans>
    );
  } else if (typeof limit === 'number')
    label = (
      <Trans>
        Round {viewed} / {limit}
      </Trans>
    );
  else
    label = (
      <Trans>
        Round {viewed} / {last}
      </Trans>
    );

  return (
    <Stack gap="md">
      <Paper withBorder radius="lg" p="sm" className={classes.head}>
        <div className={classes.nav}>
          <ActionIcon
            variant="light"
            color="brand"
            radius="xl"
            size={44}
            aria-label={t`Round ${previous}`}
            disabled={viewed <= 1}
            onClick={() => onView(previous)}
          >
            <CaretLeft />
          </ActionIcon>
          <div className={classes.label}>
            <Text fw={800} size="lg" className="tabular">
              {label}
            </Text>
            {live && (
              <Badge color="red" variant="light" leftSection={<span className={classes.dot} />}>
                <Trans comment="Marks the round being played right now">Live</Trans>
              </Badge>
            )}
          </div>
          <ActionIcon
            variant="light"
            color="brand"
            radius="xl"
            size={44}
            aria-label={t`Round ${next}`}
            disabled={viewed >= last}
            onClick={() => onView(next)}
          >
            <CaretRight />
          </ActionIcon>
        </div>
        <ProgressLine session={session} />
      </Paper>
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
      {round && round.resting.length > 0 && (
        <Paper radius="lg" p="sm" className={classes.resting}>
          <Coffee aria-hidden className={classes.restingIcon} />
          <Text size="sm">
            <Trans>Resting this round: {resting}</Trans>
          </Text>
        </Paper>
      )}
    </Stack>
  );
};
