import { z } from 'zod';

import { eventDays, isPast, type CalendarEvent, type Shift } from '~/cms/calendar';
import { SITE_URL, type IcsEvent } from '~/cms/ics';
import { ClipboardText, MapPin, PauseCircle, Racket, Trophy, UsersThree } from '~/components/ui';
import { EventKind, VISITOR_KINDS } from '~/data/events';
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

const VISITOR_KIND_SET = new Set(VISITOR_KINDS);

export type VisitorEvent = CalendarEvent & { slug: string; title: string };

export const isVisitorEvent = (event: CalendarEvent): event is VisitorEvent =>
  VISITOR_KIND_SET.has(event.kind) && Boolean(event.slug && event.title);

export const eventWhen = (event: CalendarEvent) => {
  if (!event.dateConfirmed) return event.whenText ?? '';
  const { first, last } = eventDays(event);
  return formatDateRange(first, last, LONG_DATE);
};

export type Venue = NonNullable<CalendarEvent['venue']>;

export const eventVenue = (event: CalendarEvent, home: Venue | undefined) => {
  if (event.kind === EventKind.enum.break) return undefined;
  return event.venue ?? (event.kind === EventKind.enum.trip ? undefined : home);
};

export const canAddToCalendar = (event: CalendarEvent) => event.dateConfirmed && !isPast(event, today());

const eventUrl = (event: VisitorEvent) => `${SITE_URL}${withLocale(`/arrangementer/${event.slug}`, currentLocale())}`;

export const icsEvent = (event: VisitorEvent, home: Venue | undefined): IcsEvent => ({
  ...event,
  venue: eventVenue(event, home),
  url: eventUrl(event),
});

export const shiftIcsEvent = (event: VisitorEvent, shift: Shift, title: string, home: Venue | undefined): IcsEvent => ({
  id: `${event.id}-${shift._key}`,
  title,
  startDate: shift.day,
  startTime: shift.start,
  endTime: shift.end,
  venue: eventVenue(event, home),
  url: eventUrl(event),
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
