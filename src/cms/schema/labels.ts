import { Group, PlanAudience, PriceKind } from '~/data/club';
import { EventKind, Team } from '~/data/events';
import { NewsKind } from '~/data/news';

export const GROUP_TITLES: Record<Group, string> = {
  [Group.enum.rekrutt]: 'Beginners (Rekrutt)',
  [Group.enum.junior]: 'Junior',
  [Group.enum.senior]: 'Adults (Senior)',
  [Group.enum.fritt]: 'Open play (Fritt spill)',
};

export const EVENT_KIND_TITLES: Record<EventKind, string> = {
  [EventKind.enum.training]: 'Training time',
  [EventKind.enum.break]: 'Break (no training)',
  [EventKind.enum.tournament]: 'Tournament',
  [EventKind.enum.social]: 'Social',
  [EventKind.enum.meeting]: 'Meeting',
  [EventKind.enum.trip]: 'Trip',
};

export const TEAM_TITLES: Record<Team, string> = {
  [Team.enum.hall]: 'Hall',
  [Team.enum.kiosk]: 'Kiosk',
  [Team.enum.secretariat]: 'Secretariat',
};

export const NEWS_KIND_TITLES: Record<NewsKind, string> = {
  [NewsKind.enum.training]: 'Training',
  [NewsKind.enum.event]: 'Event',
  [NewsKind.enum.volunteer]: 'Volunteering',
  [NewsKind.enum.club]: 'Club',
};

export const PRICE_KIND_TITLES: Record<PriceKind, string> = {
  [PriceKind.enum.season]: 'Season (membership and training)',
  [PriceKind.enum.membership]: 'Membership only',
  [PriceKind.enum.dropin]: 'Drop-in (pay per visit)',
  [PriceKind.enum.trial]: 'Trial',
};

export const AUDIENCE_TITLES: Record<PlanAudience, string> = {
  [PlanAudience.enum.adult]: 'Adults',
  [PlanAudience.enum.child]: 'Children',
  [PlanAudience.enum.all]: 'Everyone',
};

export const SHORT_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const titledList = <K extends string>(titles: Record<K, string>, values: readonly K[]) =>
  values.map((value) => ({ title: titles[value], value }));

export const titleOf = <K extends string>(titles: Record<K, string>, value: string | undefined) =>
  value && value in titles ? titles[value as K] : value;
