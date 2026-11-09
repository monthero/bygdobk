import type { SiteContent } from './content';
import type { Occurrence as EventOccurrence } from './schedule';

export {
  affects,
  eventDays,
  isOngoing,
  isPast,
  isTraining,
  occurrences,
  replacedBy,
  seasonOf,
  seasonOn,
  trainingSeasons,
  type Season,
} from './schedule';

export type CalendarEvent = SiteContent['events'][number];

export type Shift = CalendarEvent['shifts'][number];

export type Occurrence = EventOccurrence<CalendarEvent>;
