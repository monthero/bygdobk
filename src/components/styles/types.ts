import type { FC } from 'react';

import type { NewsPost } from '~/cms/content';
import type { ShiftBoardProps } from '~/components/events';
import type { PageIntroProps } from '~/components/ui';
import type { Group } from '~/data/club';

export type StyleKit = {
  HomeHero: FC;
  HomeExtra: FC;
  SectionDivider: FC;
  NextTraining: FC<{ group?: Group; frosted?: boolean }>;
  NewsList: FC<{ posts: NewsPost[] }>;
  ShiftBoard: FC<ShiftBoardProps>;
  PageDecor: FC;
  PageIntro: FC<PageIntroProps>;
};
