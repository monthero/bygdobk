import './page.css';
import type { StyleKit } from '../types';
import { CourtDivider } from './CourtDivider';
import { CourtHero } from './CourtHero';
import { CourtNextTraining } from './CourtNextTraining';
import { CourtPageIntro } from './CourtPageIntro';
import { CourtWeek } from './CourtWeek';

export const courtKit: Partial<StyleKit> = {
  HomeHero: CourtHero,
  HomeExtra: CourtWeek,
  SectionDivider: CourtDivider,
  NextTraining: CourtNextTraining,
  PageIntro: CourtPageIntro,
};
