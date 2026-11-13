import { SelectOrdinal } from '@lingui/react/macro';
import type { FC } from 'react';
import { z } from 'zod';

import classes from './PlaceChip.module.css';

const Tier = z.enum(['gold', 'podium', 'field']);
type Tier = z.infer<typeof Tier>;

const PODIUM = 3;

const tierOf = (rank: number): Tier => {
  if (rank === 1) return Tier.enum.gold;
  if (rank <= PODIUM) return Tier.enum.podium;
  return Tier.enum.field;
};

export const Place: FC<{ rank: number }> = ({ rank }) => (
  <SelectOrdinal value={rank} one="#st" two="#nd" few="#rd" other="#th" comment="A place in a session, e.g. 3rd" />
);

export const PlaceChip: FC<{ rank: number }> = ({ rank }) => (
  <span className={classes.chip} data-tier={tierOf(rank)}>
    <Place rank={rank} />
  </span>
);
