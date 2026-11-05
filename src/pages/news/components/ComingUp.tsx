import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Paper, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, useMemo } from 'react';

import { ArrowRight } from '~/components/ui';
import { useClosures } from '~/stores/content';
import { date, formatDateRange, SHORT_DATE } from '~/utils/dates';
import { closureReason, upcomingClosures } from '~/utils/training';

import classes from './ComingUp.module.css';

const WEEKS_AHEAD = 8;

export const ComingUp = memo(() => {
  const { i18n } = useLingui();
  const closures = useClosures();
  const soon = useMemo(() => upcomingClosures(closures, WEEKS_AHEAD), [closures]);
  if (!soon.length) return null;

  return (
    <Paper component="section" withBorder radius="lg" aria-labelledby="coming-up" className={classes.strip}>
      <Text id="coming-up" size="xs" fw={700} tt="uppercase" className={classes.label}>
        <Trans comment="Strip on the news page listing training breaks in the next weeks">Coming up</Trans>
      </Text>
      <ul className={classes.list}>
        {soon.map((c) => (
          <li key={c.id}>
            <Link to="/trening" className={classes.item}>
              <Badge variant="light" color="gray" size="lg" className="tabular">
                {formatDateRange(date(c.from), date(c.to), SHORT_DATE)}
              </Badge>
              <span className={classes.reason}>{closureReason(i18n, c)}</span>
              <ArrowRight aria-hidden className={classes.arrow} />
            </Link>
          </li>
        ))}
      </ul>
    </Paper>
  );
});
