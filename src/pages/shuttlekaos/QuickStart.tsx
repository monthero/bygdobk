import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { SimpleGrid, Text, UnstyledButton } from '@mantine/core';
import type { FC, ReactNode } from 'react';
import { z } from 'zod';

import { ChartLineUp, Shuffle, User } from '~/components/ui';
import { EVERYONE_ONCE, Format, Partners, PlayStyle, ScoreMode, type Settings } from '~/shuttlekaos/model';

import { FORMAT_LABELS, STYLE_LABELS } from './labels';

import classes from './QuickStart.module.css';

const QuickSetup = z.enum(['americano', 'mexicano', 'singles']);
type QuickSetup = z.infer<typeof QuickSetup>;

type Preset = Pick<Settings, 'format' | 'style' | 'partners' | 'scoreMode' | 'points' | 'sets' | 'rounds'>;

const PRESET_KEYS: (keyof Preset)[] = ['format', 'style', 'partners', 'scoreMode', 'points', 'sets', 'rounds'];

const MEXICANO_ROUNDS = 6;

const PRESETS: Record<
  QuickSetup,
  { preset: Preset; icon: ReactNode; label: MessageDescriptor; hint: MessageDescriptor }
> = {
  [QuickSetup.enum.americano]: {
    preset: {
      format: Format.enum.americano,
      style: PlayStyle.enum.doubles,
      partners: Partners.enum.rotating,
      scoreMode: ScoreMode.enum.race,
      points: 15,
      sets: 1,
      rounds: EVERYONE_ONCE,
    },
    icon: <Shuffle />,
    label: FORMAT_LABELS[Format.enum.americano].label,
    hint: msg`Doubles. New partner every round.`,
  },
  [QuickSetup.enum.mexicano]: {
    preset: {
      format: Format.enum.mexicano,
      style: PlayStyle.enum.doubles,
      partners: Partners.enum.rotating,
      scoreMode: ScoreMode.enum.race,
      points: 15,
      sets: 1,
      rounds: MEXICANO_ROUNDS,
    },
    icon: <ChartLineUp />,
    label: FORMAT_LABELS[Format.enum.mexicano].label,
    hint: msg`Doubles. Matched by score.`,
  },
  [QuickSetup.enum.singles]: {
    preset: {
      format: Format.enum.americano,
      style: PlayStyle.enum.singles,
      partners: Partners.enum.rotating,
      scoreMode: ScoreMode.enum.race,
      points: 15,
      sets: 1,
      rounds: EVERYONE_ONCE,
    },
    icon: <User />,
    label: STYLE_LABELS[PlayStyle.enum.singles],
    hint: msg`One on one. Play everyone.`,
  },
};

const matches = (settings: Settings, preset: Preset) => PRESET_KEYS.every((key) => settings[key] === preset[key]);

export const QuickStart: FC<{ settings: Settings; onPick: (preset: Preset) => void }> = ({ settings, onPick }) => {
  const { i18n } = useLingui();
  return (
    <SimpleGrid cols={3} spacing="xs">
      {QuickSetup.options.map((key) => {
        const { preset, icon, label, hint } = PRESETS[key];
        const active = matches(settings, preset);
        return (
          <UnstyledButton
            key={key}
            className={classes.tile}
            data-active={active || undefined}
            aria-pressed={active}
            onClick={() => onPick(preset)}
          >
            <span className={classes.icon}>{icon}</span>
            <Text fw={700} size="sm">
              {i18n._(label)}
            </Text>
            <Text size="xs" c="dimmed" className={classes.hint}>
              {i18n._(hint)}
            </Text>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
};
