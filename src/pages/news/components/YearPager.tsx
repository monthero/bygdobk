import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { ArrowLeft, ArrowRight } from '~/components/ui';

import classes from './YearPager.module.css';

type YearPagerProps = { older?: number; newer?: number; newest?: number; onPick: () => void };

export const YearPager: FC<YearPagerProps> = ({ older, newer, newest, onPick }) => {
  const { t } = useLingui();
  if (older === undefined && newer === undefined) return null;
  const param = (year: number) => (year === newest ? undefined : year);
  return (
    <nav aria-label={t`Older and newer years`} className={classes.pager}>
      {newer !== undefined && (
        <Link
          to="/nyheter"
          search={(prev) => ({ ...prev, ar: param(newer) })}
          resetScroll={false}
          onClick={onPick}
          className={classes.link}
        >
          <ArrowLeft aria-hidden className={classes.arrow} />
          <Trans comment="Link to news posts from a newer year">Newer posts: {newer}</Trans>
        </Link>
      )}
      {older !== undefined && (
        <Link
          to="/nyheter"
          search={(prev) => ({ ...prev, ar: param(older) })}
          resetScroll={false}
          onClick={onPick}
          className={classes.link}
          data-older
        >
          <Trans comment="Link to news posts from an older year">Older posts: {older}</Trans>
          <ArrowRight aria-hidden className={classes.arrow} />
        </Link>
      )}
    </nav>
  );
};
