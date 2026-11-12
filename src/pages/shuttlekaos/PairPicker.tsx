import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useState, type FC } from 'react';

import { Shuffle, X } from '~/components/ui';
import type { Pair, Player } from '~/shuttlekaos/model';

import { namesOf } from './labels';
import { PlayerAvatar, PlayerNames } from './People';

import classes from './PairPicker.module.css';

const shuffled = <T,>(items: T[]) => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
};

const pairUp = (ids: string[]): Pair[] =>
  Array.from({ length: Math.floor(ids.length * 0.5) }, (_, i): Pair => [ids[i * 2] ?? '', ids[i * 2 + 1] ?? '']);

type Props = { players: Player[]; pairs: Pair[]; onChange: (pairs: Pair[]) => void };

export const PairPicker: FC<Props> = ({ players, pairs, onChange }) => {
  const { t } = useLingui();
  const [picked, setPicked] = useState<string | null>(null);
  const byId = new Map(players.map((p) => [p.id, p]));
  const paired = new Set(pairs.flat());
  const free = players.filter((p) => !paired.has(p.id));
  const pickedId = free.some((p) => p.id === picked) ? picked : null;
  const allPaired = free.length < 2;

  const tap = (id: string) => {
    if (pickedId === null) setPicked(id);
    else if (pickedId === id) setPicked(null);
    else {
      onChange([...pairs, [pickedId, id]]);
      setPicked(null);
    }
  };

  const draw = () => {
    setPicked(null);
    if (allPaired) onChange(pairUp(shuffled(players.map((p) => p.id))));
    else onChange([...pairs, ...pairUp(shuffled(free.map((p) => p.id)))]);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" gap="sm">
        <Text size="sm" c="dimmed" className={classes.hint}>
          {free.length > 0 ? <Trans>Tap two players to pair them.</Trans> : <Trans>Everyone has a partner.</Trans>}
        </Text>
        <Button variant="light" leftSection={<Shuffle />} disabled={players.length < 2} onClick={draw} h={44}>
          {allPaired ? <Trans>Draw again</Trans> : <Trans>Draw pairs</Trans>}
        </Button>
      </Group>

      {free.length > 0 && (
        <div className={classes.free}>
          {free.map((p) => (
            <UnstyledButton
              key={p.id}
              className={classes.chip}
              aria-pressed={p.id === pickedId}
              onClick={() => tap(p.id)}
            >
              <PlayerAvatar player={p} size="sm" />
              <span className={classes.chipName}>{p.name}</span>
            </UnstyledButton>
          ))}
        </div>
      )}

      {pairs.length > 0 && (
        <ul className={classes.pairs}>
          {pairs.map((pair) => {
            const members = pair.flatMap((id) => byId.get(id) ?? []);
            const names = namesOf(members);
            return (
              <li key={pair.join()} className={classes.pair}>
                <PlayerNames players={members} />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size={44}
                  radius="xl"
                  aria-label={t`Split up ${names}`}
                  onClick={() => onChange(pairs.filter((other) => other !== pair))}
                >
                  <X />
                </ActionIcon>
              </li>
            );
          })}
        </ul>
      )}
    </Stack>
  );
};
