import { isPast, type CalendarEvent } from '~/cms/calendar';
import type { NewsPost } from '~/cms/content';

import { date, type Dayjs } from './dates';

export const postYear = (post: NewsPost) => date(post.date).year();

export const newsYears = (posts: readonly NewsPost[]) =>
  Array.from(new Set(posts.values().map(postYear))).sort((a, b) => b - a);

export const currentPosts = (posts: NewsPost[], events: readonly CalendarEvent[], day: Dayjs) => {
  const over = new Set(
    events
      .values()
      .filter((e) => isPast(e, day))
      .map((e) => e.id),
  );
  const fresh = posts.filter((p) => !p.eventId || !over.has(p.eventId));
  return fresh.length > 0 ? fresh : posts;
};

export const SEARCH_MAX = 100;
