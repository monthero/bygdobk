import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { CLUB_TIME_ZONE } from '~/cms/schedule';
import { dateFormat } from '~/i18n/current';

dayjs.extend(utc);
dayjs.extend(isoWeek);
dayjs.extend(timezone);

export { dayjs, type Dayjs };

export const ISO_DAY = 'YYYY-MM-DD';

export const SHORT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
export const LONG_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
export const CLOCK: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
export const DAY_AND_TIME: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short', ...CLOCK };

export { date, minutesOf } from '~/cms/schedule';

const toWall = (d: Dayjs) => dayjs.utc(d.tz(CLUB_TIME_ZONE).format('YYYY-MM-DDTHH:mm:ss'));

export const wallNow = () => toWall(dayjs());

export const wallTime = (iso: string) => toWall(dayjs(iso));

export const today = () => wallNow().startOf('day');

export const todayIso = () => today().format(ISO_DAY);

const MINUTE_MS = 60_000;

const wallDate = (d: Dayjs) => new Date(d.valueOf() + d.utcOffset() * MINUTE_MS);

export const formatDate = (d: Dayjs, options: Intl.DateTimeFormatOptions) => dateFormat(options).format(wallDate(d));

export const formatDateRange = (start: Dayjs, end: Dayjs, options: Intl.DateTimeFormatOptions) =>
  dateFormat(options).formatRange(wallDate(start), wallDate(end));

export const weekdayName = (isoWeekday: number, style: 'long' | 'short' = 'long') =>
  formatDate(today().isoWeekday(isoWeekday), { weekday: style });
