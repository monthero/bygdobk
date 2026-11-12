import { Trans } from '@lingui/react/macro';
import type { FC } from 'react';

import { orListFormat } from '~/i18n/current';
import { Level } from '~/shuttlekaos/model';

const sorted = (levels: Level[]) => Level.options.filter((l) => levels.includes(l));

const isRun = (levels: Level[]) => {
  const first = Level.options.indexOf(levels.at(0) ?? Level.enum.E);
  return levels.every((l, i) => Level.options.indexOf(l) === first + i);
};

export const LevelsText: FC<{ levels: Level[] }> = ({ levels }) => {
  const picked = sorted(levels);
  if (picked.length === 0 || picked.length === Level.options.length) return <Trans>All levels</Trans>;
  if (picked.length === 1) {
    const level = picked.at(0);
    return <Trans comment="Badminton level, e.g. Level C">Level {level}</Trans>;
  }
  if (isRun(picked)) {
    const first = picked.at(0);
    const last = picked.at(-1);
    return (
      <Trans comment="Range of badminton levels, e.g. Level C–D">
        Level {first}–{last}
      </Trans>
    );
  }
  const list = orListFormat().format(picked);
  return <Trans comment="Several badminton levels, e.g. Level A or C">Level {list}</Trans>;
};
