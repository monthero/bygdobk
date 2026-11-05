import { ClipboardText, MapPin, Trophy, UsersThree } from '~/components/ui';
import { EventKind, type ClubEvent } from '~/data/events';
import { date, formatDateRange, LONG_DATE } from '~/utils/dates';

export const EVENT_ICONS: Record<EventKind, typeof Trophy> = {
  [EventKind.enum.tournament]: Trophy,
  [EventKind.enum.social]: UsersThree,
  [EventKind.enum.meeting]: ClipboardText,
  [EventKind.enum.trip]: MapPin,
};

export const eventWhen = (event: ClubEvent, fallback: string) =>
  event.from && event.to ? formatDateRange(date(event.from), date(event.to), LONG_DATE) : fallback;
