import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Badge, Card, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type FC } from 'react';

import { isOngoing, isPast } from '~/cms/calendar';
import { Clock, HandHeart } from '~/components/ui';
import { EVENT_KINDS } from '~/data/events';
import { today } from '~/utils/dates';
import { useShiftCounts } from '~/volunteers/queries';

import { EventBanner } from './EventBanner';
import { EVENT_ICONS, eventWhen, registrationOf, RegistrationState, type VisitorEvent } from './eventMeta';
import { peopleNeeded, spotsTaken } from './shifts';

import classes from './EventCard.module.css';

type Props = { event: VisitorEvent; compact?: boolean };

const ShiftFill: FC<{ event: VisitorEvent; needed: number }> = ({ event, needed }) => {
  const { data } = useShiftCounts(event.id);
  const filled = data && spotsTaken(event.shifts, data);
  return (
    <Group gap={6} wrap="nowrap" className={classes.shifts}>
      <HandHeart aria-hidden />
      <Text size="sm" className="tabular">
        {filled !== undefined ? (
          <Trans>
            {filled} of {needed} spots filled
          </Trans>
        ) : (
          <Plural value={needed} one="# volunteer needed" other="# volunteers needed" />
        )}
      </Text>
    </Group>
  );
};

const SignUpBy: FC<{ event: VisitorEvent }> = ({ event }) => {
  const registration = registrationOf(event);
  if (!registration?.deadline || registration.state === RegistrationState.enum.closed) return null;
  const { deadline } = registration;
  return (
    <Group gap={6} wrap="nowrap" className={classes.signUp} data-state={registration.state}>
      <Clock aria-hidden />
      <Text size="sm" className="tabular">
        <Trans>Sign up by {deadline}</Trans>
      </Text>
    </Group>
  );
};

const EventSummary = memo<Props>(({ event, compact = false }) => {
  const { i18n } = useLingui();
  const day = today();
  const past = isPast(event, day);
  const ongoing = isOngoing(event, day);
  const kind = EVENT_KINDS[event.kind];
  const needed = peopleNeeded(event.shifts);
  return (
    <Stack gap={compact ? 2 : 6}>
      <Group gap="xs">
        {compact ? <Text fw={700}>{event.title}</Text> : <Title order={3}>{event.title}</Title>}
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
        {eventWhen(event)}
      </Text>
      {!compact && event.description && <Text c="dimmed">{event.description}</Text>}
      <SignUpBy event={event} />
      {needed > 0 && <ShiftFill event={event} needed={needed} />}
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
      <Group wrap="nowrap" align={compact ? 'center' : 'flex-start'}>
        {withIcon && (
          <ThemeIcon
            visibleFrom={compact ? 'sm' : undefined}
            size={compact ? 40 : 48}
            radius="md"
            variant="light"
            color={kind.color}
            className={classes.icon}
          >
            <Icon width={compact ? 22 : 26} height={compact ? 22 : 26} />
          </ThemeIcon>
        )}
        <div className={classes.summary}>
          <EventSummary event={event} compact={compact} />
        </div>
        {compact && <EventBanner event={event} aspect={4 / 3} sizes="88px" decorative className={classes.thumb} />}
      </Group>
    </Card>
  );
});
