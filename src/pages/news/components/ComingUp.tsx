import { Trans } from '@lingui/react/macro';
import { Badge, Paper, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, useMemo } from 'react';

import { eventDays } from '~/cms/calendar';
import { useSiteContent } from '~/cms/content';
import { ArrowRight } from '~/components/ui';
import { formatDateRange, SHORT_DATE, today } from '~/utils/dates';
import { trainingBreaks } from '~/utils/training';

import classes from './ComingUp.module.css';

const WEEKS_AHEAD = 8;

export const ComingUp = memo(() => {
  const { events } = useSiteContent();
  const soon = useMemo(() => {
    const from = today();
    return trainingBreaks(events, from, from.add(WEEKS_AHEAD, 'week'));
  }, [events]);
  if (!soon.length) return null;

  return (
    <Paper component="section" withBorder radius="lg" aria-labelledby="coming-up" className={classes.strip}>
      <Text id="coming-up" size="xs" fw={700} tt="uppercase" className={classes.label}>
        <Trans comment="Strip on the news page listing training breaks in the next weeks">Coming up</Trans>
      </Text>
      <ul className={classes.list}>
        {soon.map((event) => {
          const { first, last } = eventDays(event);
          return (
            <li key={event.id}>
              <Link to="/trening" className={classes.item}>
                <Badge variant="light" color="gray" size="lg" className="tabular">
                  {formatDateRange(first, last, SHORT_DATE)}
                </Badge>
                <span className={classes.reason}>{event.title}</span>
                <ArrowRight aria-hidden className={classes.arrow} />
              </Link>
            </li>
          );
        })}
      </ul>
    </Paper>
  );
});
