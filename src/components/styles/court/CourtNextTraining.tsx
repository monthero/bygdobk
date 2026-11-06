import type { FC } from 'react';

import { NextTraining } from '~/components/training/NextTraining';
import type { Group } from '~/data/club';

import classes from './CourtNextTraining.module.css';

export const CourtNextTraining: FC<{ group?: Group; frosted?: boolean }> = ({ group, frosted }) => (
  <div className={classes.frame}>
    <NextTraining group={group} frosted={frosted} />
  </div>
);
