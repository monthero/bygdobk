import { z } from 'zod';

import { calendarFile } from '../../../src/cms/ics.ts';
import { GROUP_SLUGS, type Group } from '../../../src/data/groupKeys.ts';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../../../src/i18n/locales.ts';
import { fetchEvents } from './events.ts';
import { clubToday, fetchTraining, trainingCalendar } from './training.ts';

const CALENDAR_NAME = 'Bygdø Badmintonklubb';
const CACHE_SECONDS = 15 * 60;

const Lang = z.enum(LOCALES).catch(DEFAULT_LOCALE);

const eventsFeed = async (lang: Locale) => calendarFile(await fetchEvents(lang), CALENDAR_NAME);

const trainingFeed = async (group: Group, lang: Locale) => {
  const today = clubToday();
  return trainingCalendar(await fetchTraining(group, lang, today), group, lang, today);
};

const icsResponse = (body: string, filename: string) =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': `public, max-age=${CACHE_SECONDS}`,
    },
  });

export default {
  fetch: async (req: Request) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });

    const params = new URL(req.url).searchParams;
    const lang = Lang.parse(params.get('lang'));
    const slug = params.get('gruppe');
    const group = GROUP_SLUGS.fromSlug(slug ?? undefined);
    if (slug && !group) return new Response('Unknown group', { status: 404 });

    try {
      if (group) return icsResponse(await trainingFeed(group, lang), `trening-${slug}.ics`);
      return icsResponse(await eventsFeed(lang), 'kalender.ics');
    } catch (error) {
      console.error('Building the calendar failed', error);
      return new Response('Could not load the calendar', { status: 502 });
    }
  },
};
