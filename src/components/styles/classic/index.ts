import { ShiftBoard } from '~/components/events';
import { NewsList } from '~/components/news';
import { NextTraining } from '~/components/training';
import { PageIntroBase } from '~/components/ui';

import type { StyleKit } from '../types';
import { ClassicHero } from './ClassicHero';

const Nothing = () => null;

export const classicKit: StyleKit = {
  HomeHero: ClassicHero,
  HomeExtra: Nothing,
  SectionDivider: Nothing,
  NextTraining,
  NewsList,
  ShiftBoard,
  PageDecor: Nothing,
  PageIntro: PageIntroBase,
};
