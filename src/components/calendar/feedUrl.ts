import { GROUP_SLUGS, type Group } from '~/data/club';
import { currentLocale } from '~/i18n/current';

export const calendarFeedUrl = (group?: Group) => {
  const url = new URL('/kalender.ics', window.location.origin);
  if (group) url.searchParams.set('gruppe', GROUP_SLUGS.toSlug(group));
  url.searchParams.set('lang', currentLocale());
  return url.href;
};
