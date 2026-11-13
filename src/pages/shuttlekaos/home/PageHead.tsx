import type { FC, ReactNode } from 'react';

import { IntroText } from '~/components/ui/PageIntro';

import classes from './PageHead.module.css';

type Props = { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; children?: ReactNode };

export const PageHead: FC<Props> = ({ eyebrow, title, sub, children }) => (
  <header className={classes.head}>
    <IntroText eyebrow={eyebrow} title={title} lede={sub} order={2} classes={classes}>
      {children}
    </IntroText>
  </header>
);
