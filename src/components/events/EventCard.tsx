import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import { HandHeart } from '~/components/ui';
import { EVENT_KINDS, isOngoing, isPast, type ClubEvent } from '~/data/events';
import { ISO_DAY, dayjs } from '~/utils/dates';

import { EVENT_ICONS, eventWhen } from './eventMeta';
import { shiftTotals } from './shifts';

import classes from './EventCard.module.css';

type Props = { event: ClubEvent; compact?: boolean };

const EventSummary = memo<Props>(({ event, compact = false }) => {
  const { i18n } = useLingui();
  const today = dayjs().format(ISO_DAY);
  const past = isPast(event, today);
  const ongoing = isOngoing(event, today);
  const kind = EVENT_KINDS[event.kind];
  const shifts = event.shifts && shiftTotals(event.shifts.list);
  return (
    <Stack gap={compact ? 2 : 6}>
      <Group gap="xs">
        {compact ? <Text fw={700}>{event.name}</Text> : <Title order={3}>{event.name}</Title>}
        <Badge size="sm" variant="light" color={kind.color}>
          {i18n._(kind.label)}
        </Badge>
        {past && (
          <Badge size="sm" variant="light" color="gray">
            <Trans comment="Badge on a tournament that has already taken place">Done</Trans>
          </Badge>
        )}
        {ongoing && (
          <Badge size="sm" variant="filled" color="teal">
            <Trans comment="Badge on an event that is happening today">Now on</Trans>
          </Badge>
        )}
      </Group>
      <Text
        fw={compact ? 400 : 600}
        size={compact ? 'sm' : 'md'}
        c={compact ? 'dimmed' : undefined}
        className="tabular"
      >
        {eventWhen(event, i18n._(event.season))}
      </Text>
      {!compact && <Text c="dimmed">{i18n._(event.description)}</Text>}
      {shifts && (
        <Group gap={6} wrap="nowrap" className={classes.shifts}>
          <HandHeart aria-hidden />
          <Text size="sm" className="tabular">
            <Trans comment="Volunteer shift spots filled for an event">
              {shifts.taken} of {shifts.spots} shifts taken
            </Trans>
          </Text>
        </Group>
      )}
    </Stack>
  );
});

export const EventCard = memo<Props & { withIcon?: boolean }>(({ event, compact = false, withIcon = true }) => {
  const kind = EVENT_KINDS[event.kind];
  const Icon = EVENT_ICONS[event.kind];
  return (
    <Card
      withBorder
      radius="lg"
      padding={withIcon ? 'lg' : 'md'}
      renderRoot={(props) => <Link {...props} to="/arrangementer/$slug" params={{ slug: event.slug }} />}
      className={classes.card}
    >
      {withIcon ? (
        <Group wrap="nowrap" align="flex-start">
          <ThemeIcon size={compact ? 40 : 48} radius="md" variant="light" color={kind.color}>
            <Icon width={compact ? 22 : 26} height={compact ? 22 : 26} />
          </ThemeIcon>
          <EventSummary event={event} compact={compact} />
        </Group>
      ) : (
        <EventSummary event={event} compact={compact} />
      )}
    </Card>
  );
});
