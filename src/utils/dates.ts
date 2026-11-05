import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';

import { dateFormat } from '~/i18n/current';

dayjs.extend(utc);
dayjs.extend(isoWeek);

export { dayjs, type Dayjs };

export const ISO_DAY = 'YYYY-MM-DD';

export const SHORT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
export const LONG_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

export const date = (iso: string) => dayjs.utc(iso);

export const today = () => date(dayjs().format(ISO_DAY));

const MINUTE_MS = 60_000;

const wallDate = (d: Dayjs) => new Date(d.valueOf() + d.utcOffset() * MINUTE_MS);

export const formatDate = (d: Dayjs, options: Intl.DateTimeFormatOptions) => dateFormat(options).format(wallDate(d));

export const formatDateRange = (start: Dayjs, end: Dayjs, options: Intl.DateTimeFormatOptions) =>
  dateFormat(options).formatRange(wallDate(start), wallDate(end));

export const weekdayName = (isoWeekday: number, style: 'long' | 'short' = 'long') =>
  formatDate(date('2024-01-01').add(isoWeekday - 1, 'day'), { weekday: style });

export const minutesOf = (time: string) => {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return h * 60 + m;
};
