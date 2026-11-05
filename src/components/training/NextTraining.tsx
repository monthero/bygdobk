import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Badge, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { AddressLink, ArrowRight, MapPin, Warning } from '~/components/ui';
import { CURRENT_SEASON, GROUP_SLUGS, GROUPS, type Group as TrainingGroup } from '~/data/club';
import { useClosures } from '~/stores/content';
import { dayjs, formatDate } from '~/utils/dates';
import { closureReason, isLive, nextTrainingDay } from '~/utils/training';

import classes from './NextTraining.module.css';

type Props = { group?: TrainingGroup; frosted?: boolean };

const DAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };

export const NextTraining: FC<Props> = ({ group, frosted = false }) => {
  const { i18n } = useLingui();
  const closures = useClosures();
  const next = nextTrainingDay(closures, group);
  if (!next) return null;

  const isToday = next.day.isSame(dayjs(), 'day');
  const dayLabel = formatDate(next.day, DAY_FORMAT);

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

        {next.closure ? (
          <Alert color="yellow" icon={<Warning />} title={<Trans>No training</Trans>}>
            {closureReason(i18n, next.closure)}
          </Alert>
        ) : (
          <Stack gap={8}>
            {next.sessions.map((s) => (
              <Group key={`${s.group}-${s.start}`} justify="space-between" wrap="nowrap" className={classes.row}>
                <Group gap={8} wrap="nowrap">
                  <Badge color={GROUPS[s.group].color} variant="light" size="lg">
                    {i18n._(GROUPS[s.group].name)}
                  </Badge>
                  {isLive(s) && (
                    <Badge color="green" variant="dot" size="sm">
                      <Trans>On now</Trans>
                    </Badge>
                  )}
                </Group>
                <Text fw={600} className="tabular">
                  {s.start}–{s.end}
                </Text>
              </Group>
            ))}
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
              params={{ sesong: CURRENT_SEASON.id }}
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
