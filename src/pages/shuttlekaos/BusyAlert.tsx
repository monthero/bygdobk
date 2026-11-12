import { Trans } from '@lingui/react/macro';
import { Alert, Button, Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import { LinkBreak, Warning } from '~/components/ui';
import type { Player } from '~/shuttlekaos/model';

import { sameName, unlinkPlayers } from './labels';

type Props = { players: Player[]; names: string[]; pending?: boolean; onUnlink: (players: Player[]) => void };

export const BusyAlert: FC<Props> = ({ players, names, pending, onUnlink }) => {
  const busy = players.filter((p) => p.profileId && names.some((name) => sameName(name, p.name)));
  return (
    <Alert color="red" variant="light" icon={<Warning />} title={<Trans>Someone is busy elsewhere</Trans>}>
      <Stack gap="sm" align="flex-start">
        {busy.length === 0 && (
          <Text size="sm">
            <Trans>A linked player is already playing in another session.</Trans>
          </Text>
        )}
        {busy.map((player) => {
          const name = player.name;
          return (
            <Stack key={player.id} gap={6} align="flex-start">
              <Text size="sm">
                <Trans>{name} is playing in another session.</Trans>
              </Text>
              <Button
                size="sm"
                variant="white"
                color="red"
                leftSection={<LinkBreak />}
                loading={pending}
                onClick={() => onUnlink(unlinkPlayers(players, [name]))}
              >
                <Trans>Keep {name} as a plain name</Trans>
              </Button>
            </Stack>
          );
        })}
      </Stack>
    </Alert>
  );
};
