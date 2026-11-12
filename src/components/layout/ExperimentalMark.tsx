import { useLingui } from '@lingui/react/macro';
import { Tooltip, VisuallyHidden } from '@mantine/core';
import type { FC } from 'react';

import { Flask } from '~/components/ui';

import classes from './ExperimentalMark.module.css';

export const ExperimentalMark: FC = () => {
  const { t } = useLingui();
  const label = t({
    message: 'Experimental feature',
    comment: 'Tooltip on the flask icon next to ShuttleKaos in menus',
  });
  return (
    <Tooltip label={label} withArrow openDelay={200}>
      <span className={classes.mark}>
        <Flask aria-hidden />
        <VisuallyHidden>({label})</VisuallyHidden>
      </span>
    </Tooltip>
  );
};
