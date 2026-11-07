import { Trans } from '@lingui/react/macro';
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { memo, useState, type FC } from 'react';

import { calendarFile } from '~/cms/ics';
import { useClub } from '~/cms/siteData';
import { AddressLink, ArrowUpRight, CalendarPlus, Check, Clock, LockSimple } from '~/components/ui';
import { downloadFile } from '~/utils/download';

import {
  canAddToCalendar,
  eventVenue,
  icsEvent,
  registrationOf,
  RegistrationState,
  type Registration,
  type Venue,
  type VisitorEvent,
} from './eventMeta';

import classes from './EventDetails.module.css';

const DONE_MS = 2500;
const ICS_TYPE = 'text/calendar;charset=utf-8';

export const EventVenue = memo<{ event: VisitorEvent }>(({ event }) => {
  const venue = eventVenue(event, useClub().venue);
  if (!venue) return null;
  return (
    <AddressLink place={venue}>{event.venue && <ArrowUpRight aria-hidden className={classes.external} />}</AddressLink>
  );
});

const downloadIcs = (event: VisitorEvent, home: Venue | undefined) =>
  downloadFile(calendarFile([icsEvent(event, home)]), `${event.slug}.ics`, ICS_TYPE);

const AddToCalendar: FC<{ event: VisitorEvent }> = ({ event }) => {
  const home = useClub().venue;
  const [done, setDone] = useState(false);
  const { start } = useTimeout(() => setDone(false), DONE_MS);
  const add = () => {
    downloadIcs(event, home);
    setDone(true);
    start();
  };
  return (
    <Button
      variant={done ? 'light' : 'default'}
      color={done ? 'teal' : undefined}
      leftSection={done ? <Check /> : <CalendarPlus />}
      onClick={add}
      aria-live="polite"
    >
      {done ? (
        <Trans comment="Shown briefly after the calendar file was downloaded">Downloaded</Trans>
      ) : (
        <Trans>Add to calendar</Trans>
      )}
    </Button>
  );
};

const Deadline: FC<{ registration: Registration }> = ({ registration: { state, deadline } }) => {
  if (!deadline) return null;
  const closed = state === RegistrationState.enum.closed;
  const soon = state === RegistrationState.enum.closingSoon;
  return (
    <Group gap={6} wrap="nowrap" className={classes.deadline} data-state={state}>
      <Clock aria-hidden />
      <Text size="sm" fw={soon ? 600 : undefined} className="tabular">
        {closed ? <Trans>Closed {deadline}</Trans> : <Trans>Sign up by {deadline}</Trans>}
      </Text>
      {soon && (
        <Badge size="sm" variant="light" color="orange">
          <Trans comment="Badge when the sign-up deadline is within 3 days">Closing soon</Trans>
        </Badge>
      )}
    </Group>
  );
};

const SignUp: FC<{ registration: Registration }> = ({ registration: { state, url } }) => {
  if (state === RegistrationState.enum.closed) {
    return (
      <Button disabled leftSection={<LockSimple />}>
        <Trans>Registration closed</Trans>
      </Button>
    );
  }
  if (!url) return null;
  return (
    <Button component="a" href={url} target="_blank" rel="noopener noreferrer" rightSection={<ArrowUpRight />}>
      <Trans comment="Button that opens the tournament registration page">Sign up</Trans>
    </Button>
  );
};

export const EventActions = memo<{ event: VisitorEvent }>(({ event }) => {
  const registration = registrationOf(event);
  const canAdd = canAddToCalendar(event);
  if (!registration && !canAdd) return null;
  return (
    <Paper withBorder radius="lg" p="md" className={classes.actions}>
      <Stack gap="sm">
        {registration && <Deadline registration={registration} />}
        <Group gap="sm">
          {registration && <SignUp registration={registration} />}
          {canAdd && <AddToCalendar event={event} />}
        </Group>
      </Stack>
    </Paper>
  );
});
