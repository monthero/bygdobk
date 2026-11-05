import type { FC } from 'react';

import type { PageIntroProps } from '~/components/ui';

import { useStyleKit } from './index';

export const PageIntro: FC<PageIntroProps> = (props) => {
  const { PageIntro: Intro } = useStyleKit();
  return <Intro {...props} />;
};
