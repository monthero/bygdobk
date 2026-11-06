import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useMemo, type FC } from 'react';

import { useSiteContent } from '~/cms/content';
import { AddressLink, ArrowRight, MapPin, Warning } from '~/components/ui';
import { GROUP_SLUGS, GROUPS, type Group as TrainingGroup } from '~/data/club';
import { useSeasons } from '~/hooks/useSeasons';
import { listFormat } from '~/i18n/current';
import { formatDate, today } from '~/utils/dates';
import { isLive, nextTrainingDay, offTitles } from '~/utils/training';

import classes from './NextTraining.module.css';

type Props = { group?: TrainingGroup; frosted?: boolean };

const DAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };

export const NextTraining: FC<Props> = ({ group, frosted = false }) => {
  const { i18n } = useLingui();
  const { events } = useSiteContent();
  const { current } = useSeasons();
  const next = useMemo(() => nextTrainingDay(events, group), [events, group]);
  if (!next) return null;

  const isToday = next.day.isSame(today(), 'day');
  const dayLabel = formatDate(next.day, DAY_FORMAT);
  const allOff = next.sessions.every((s) => s.off);

  return (
    <Paper withBorder radius="lg" p="lg" shadow="sm" className={classes.card} data-frosted={frosted || undefined}>
      <Stack gap="md">
        <div>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {isToday ? <Trans>Training today</Trans> : <Trans>Next training</Trans>}
          </Text>
          <Title order={3} className={classes.day}>
            {dayLabel}
          </Title>
        </div>

        {allOff ? (
          <Alert color="yellow" icon={<Warning />} title={<Trans>No training</Trans>}>
            {listFormat().format(offTitles(next.sessions))}
          </Alert>
        ) : (
          <Stack gap={8}>
            {next.sessions.map((s) => {
              const reason = s.off?.title;
              return (
                <Group
                  key={`${s.group}-${s.start.valueOf()}`}
                  justify="space-between"
                  wrap="nowrap"
                  className={classes.row}
                  data-off={s.off ? true : undefined}
                >
                  <Stack gap={2}>
                    <Group gap={8} wrap="nowrap">
                      <Badge color={s.off ? 'gray' : GROUPS[s.group].color} variant="light" size="lg">
                        {i18n._(GROUPS[s.group].name)}
                      </Badge>
                      {isLive(s) && (
                        <Badge color="green" variant="dot" size="sm">
                          <Trans>On now</Trans>
                        </Badge>
                      )}
                    </Group>
                    {reason && (
                      <Text size="sm" className={classes.offNote}>
                        <Trans>No training: {reason}</Trans>
                      </Text>
                    )}
                  </Stack>
                  <Text fw={600} className={`${classes.time} tabular`}>
                    {s.event.startTime}–{s.event.endTime}
                  </Text>
                </Group>
              );
            })}
          </Stack>
        )}

        <Group gap={6} c="dimmed">
          <MapPin />
          <Text size="sm">
            <AddressLink />
          </Text>
        </Group>
        <Text
          size="sm"
          fw={600}
          c="var(--bk-accent-strong)"
          renderRoot={(props) => (
            <Link
              {...props}
              to="/trening/$sesong"
              params={{ sesong: current.id }}
              search={{ gruppe: group && GROUP_SLUGS.toSlug(group) }}
            />
          )}
        >
          <Trans>Full schedule</Trans> <ArrowRight className={classes.arrow} />
        </Text>
      </Stack>
    </Paper>
  );
};
