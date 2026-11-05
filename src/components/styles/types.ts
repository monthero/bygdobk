import type { FC } from 'react';

import type { ShiftBoardProps } from '~/components/events';
import type { PageIntroProps } from '~/components/ui';
import type { Group } from '~/data/club';
import type { NewsPost } from '~/data/news';

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
