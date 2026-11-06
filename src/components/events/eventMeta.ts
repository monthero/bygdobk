import { z } from 'zod';

import { eventDays, isPast, type CalendarEvent } from '~/cms/calendar';
import { SITE_URL, type IcsEvent } from '~/cms/ics';
import { ClipboardText, MapPin, PauseCircle, Racket, Trophy, UsersThree } from '~/components/ui';
import { CLUB } from '~/data/club';
import { EventKind } from '~/data/events';
import { currentLocale } from '~/i18n/current';
import { withLocale } from '~/i18n/locales';
import { DAY_AND_TIME, dayjs, formatDate, formatDateRange, LONG_DATE, today, wallTime } from '~/utils/dates';

export const EVENT_ICONS: Record<EventKind, typeof Trophy> = {
  [EventKind.enum.training]: Racket,
  [EventKind.enum.break]: PauseCircle,
  [EventKind.enum.tournament]: Trophy,
  [EventKind.enum.social]: UsersThree,
  [EventKind.enum.meeting]: ClipboardText,
  [EventKind.enum.trip]: MapPin,
};

const VISITOR_KINDS = new Set<EventKind>([
  EventKind.enum.tournament,
  EventKind.enum.social,
  EventKind.enum.meeting,
  EventKind.enum.trip,
]);

export type VisitorEvent = CalendarEvent & { slug: string; title: string };

export const isVisitorEvent = (event: CalendarEvent): event is VisitorEvent =>
  VISITOR_KINDS.has(event.kind) && Boolean(event.slug && event.title);

export const eventWhen = (event: CalendarEvent) => {
  if (!event.dateConfirmed) return event.whenText ?? '';
  const { first, last } = eventDays(event);
  return formatDateRange(first, last, LONG_DATE);
};

export type Venue = NonNullable<CalendarEvent['venue']>;

const HOME_VENUE: Venue = { name: CLUB.venue, address: CLUB.address, mapUrl: undefined };

export const eventVenue = (event: CalendarEvent) =>
  event.venue ?? (event.kind === EventKind.enum.trip ? undefined : HOME_VENUE);

export const isHomeVenue = (venue: Venue) => venue.name === CLUB.venue;

export const canAddToCalendar = (event: CalendarEvent) => event.dateConfirmed && !isPast(event, today());

export const icsEvent = (event: VisitorEvent): IcsEvent => ({
  ...event,
  venue: eventVenue(event),
  url: `${SITE_URL}${withLocale(`/arrangementer/${event.slug}`, currentLocale())}`,
});

export const RegistrationState = z.enum(['open', 'closingSoon', 'closed']);
export type RegistrationState = z.infer<typeof RegistrationState>;

export type Registration = { state: RegistrationState; url?: string; deadline?: string };

const CLOSING_SOON_DAYS = 3;

const stateBefore = (deadline: string): RegistrationState => {
  const daysLeft = dayjs(deadline).diff(dayjs(), 'day', true);
  if (daysLeft <= 0) return RegistrationState.enum.closed;
  if (daysLeft <= CLOSING_SOON_DAYS) return RegistrationState.enum.closingSoon;
  return RegistrationState.enum.open;
};

export const registrationOf = (event: CalendarEvent): Registration | undefined => {
  const { registrationUrl: url, registrationDeadline } = event;
  if ((!url && !registrationDeadline) || isPast(event, today())) return undefined;
  if (!registrationDeadline) return { state: RegistrationState.enum.open, url };
  return {
    state: stateBefore(registrationDeadline),
    url,
    deadline: formatDate(wallTime(registrationDeadline), DAY_AND_TIME),
  };
};
