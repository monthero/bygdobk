import { Trans } from '@lingui/react/macro';
import { Button, Group, Stack } from '@mantine/core';
import { useMemo, type FC } from 'react';

import { ArrowRight, FlagCheckered, ResponsiveModal } from '~/components/ui';
import type { Session } from '~/shuttlekaos/model';

import { rankMoves, standingsUpTo, type PlayerMap } from './labels';
import { StandingsTable } from './StandingsTable';

import classes from './RoundDone.module.css';

type Props = {
  session: Session;
  round: number;
  players: PlayerMap;
  last?: boolean;
  pending?: boolean;
  onNext?: () => void;
  onFinish?: () => void;
  onClose: () => void;
};

export const RoundDone: FC<Props> = ({ session, round, players, last, pending, onNext, onFinish, onClose }) => {
  const rows = useMemo(() => standingsUpTo(session, round), [session, round]);
  const moves = useMemo(() => rankMoves(session, round), [session, round]);
  const action = last ? onFinish : onNext;

  return (
    <ResponsiveModal opened onClose={onClose} title={<Trans>Round {round} done</Trans>}>
      <Stack gap="md">
        <div className={classes.table}>
          <StandingsTable rows={rows} session={session} players={players} moves={moves} podium />
        </div>
        <Group justify="flex-end" gap="sm" grow={Boolean(action)}>
          <Button variant="default" size="md" onClick={onClose}>
            <Trans>Close</Trans>
          </Button>
          {action && (
            <Button
              size="md"
              loading={pending}
              leftSection={last ? <FlagCheckered /> : undefined}
              rightSection={last ? undefined : <ArrowRight />}
              onClick={action}
            >
              {last ? <Trans>Finish</Trans> : <Trans>Next round</Trans>}
            </Button>
          )}
        </Group>
      </Stack>
    </ResponsiveModal>
  );
};
