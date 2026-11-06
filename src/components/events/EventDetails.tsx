import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { memo, useState, type FC } from 'react';

import { calendarFile } from '~/cms/ics';
import { AddressLink, ArrowUpRight, CalendarPlus, Check, Clock, LockSimple } from '~/components/ui';
import { venueMapUrl } from '~/utils/maps';

import {
  canAddToCalendar,
  eventVenue,
  icsEvent,
  isHomeVenue,
  registrationOf,
  RegistrationState,
  type Registration,
  type VisitorEvent,
} from './eventMeta';

import classes from './EventDetails.module.css';

const DONE_MS = 2500;
const REVOKE_MS = 1000;

export const EventVenue = memo<{ event: VisitorEvent }>(({ event }) => {
  const { t } = useLingui();
  const venue = eventVenue(event);
  if (!venue) return null;
  if (isHomeVenue(venue)) return <AddressLink />;
  const place = [venue.name, venue.address].filter(Boolean).join(', ');
  return (
    <Anchor
      href={venueMapUrl(venue)}
      target="_blank"
      rel="noopener noreferrer"
      inherit
      c="inherit"
      underline="always"
      title={t`Open in maps`}
    >
      {place}
      <ArrowUpRight aria-hidden className={classes.external} />
    </Anchor>
  );
});

const downloadIcs = (event: VisitorEvent) => {
  const blob = new Blob([calendarFile([icsEvent(event)])], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: `${event.slug}.ics` });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
};

const AddToCalendar: FC<{ event: VisitorEvent }> = ({ event }) => {
  const [done, setDone] = useState(false);
  const { start } = useTimeout(() => setDone(false), DONE_MS);
  const add = () => {
    downloadIcs(event);
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
