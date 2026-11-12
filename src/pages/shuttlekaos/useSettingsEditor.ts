import { useState } from 'react';

import { EVERYONE_ONCE, ScoreMode, type Settings } from '~/shuttlekaos/model';

import { DEFAULT_POINTS, RoundsChoice } from './labels';

const DEFAULT_ROUNDS = 6;

export type SettingsEditor = ReturnType<typeof useSettingsEditor>;

export const useSettingsEditor = (settings: Settings, onChange: (patch: Partial<Settings>) => void) => {
  const [roundCount, setRoundCount] = useState(typeof settings.rounds === 'number' ? settings.rounds : DEFAULT_ROUNDS);
  const [pointsByMode, setPointsByMode] = useState(() => ({
    ...DEFAULT_POINTS,
    [settings.scoreMode]: settings.points,
  }));

  const pickMode = (mode: string) => {
    const scoreMode = ScoreMode.parse(mode);
    onChange({ scoreMode, points: pointsByMode[scoreMode] });
  };

  const setPoints = (points: number | null) => {
    if (points === null) return;
    onChange({ points });
    setPointsByMode((current) => ({ ...current, [settings.scoreMode]: points }));
  };

  const pickRounds = (choice: RoundsChoice) => {
    if (choice === RoundsChoice.enum.everyone) onChange({ rounds: EVERYONE_ONCE });
    else onChange({ rounds: choice === RoundsChoice.enum.open ? null : roundCount });
  };

  const setRounds = (count: number | null) => {
    if (count === null) return;
    setRoundCount(count);
    onChange({ rounds: count });
  };

  return { settings, onChange, pickMode, setPoints, pickRounds, setRounds };
};
