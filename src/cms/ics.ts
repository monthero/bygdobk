import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { z } from 'zod';

import { CLUB_TIME_ZONE } from './schedule.ts';

dayjs.extend(utc);

export const SITE_URL = 'https://bygdobk.vercel.app';

const UID_DOMAIN = 'bygdobk.no';
const MAX_OCTETS = 75;
const CRLF = '\r\n';
const ENCODER = new TextEncoder();

export const IcsStatus = z.enum(['CONFIRMED', 'CANCELLED']);
export type IcsStatus = z.infer<typeof IcsStatus>;

export type IcsVenue = { name: string; address?: string };

export type IcsEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  venue?: IcsVenue;
  url?: string;
  status?: IcsStatus;
};

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${CLUB_TIME_ZONE}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const ESCAPED = new Map([
  ['\\', String.raw`\\`],
  [',', String.raw`\,`],
  [';', String.raw`\;`],
  ['\n', String.raw`\n`],
]);

const escapeText = (text: string) =>
  text.replaceAll(/\r\n?/g, '\n').replaceAll(/[\\,;\n]/g, (c) => ESCAPED.get(c) ?? c);

const fold = (line: string) => {
  const parts: string[] = [];
  let current = '';
  let octets = 0;
  for (const char of line) {
    const size = ENCODER.encode(char).length;
    const limit = parts.length === 0 ? MAX_OCTETS : MAX_OCTETS - 1;
    if (octets + size > limit) {
      parts.push(current);
      current = '';
      octets = 0;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
};

const day = (iso: string) => dayjs.utc(iso).format('YYYYMMDD');
const nextDay = (iso: string) => dayjs.utc(iso).add(1, 'day').format('YYYYMMDD');
const clock = (time: string) => `${time.replace(':', '')}00`;

const timing = ({ startDate, endDate = startDate, startTime, endTime }: IcsEvent) => {
  if (!startTime && !endTime) return [`DTSTART;VALUE=DATE:${day(startDate)}`, `DTEND;VALUE=DATE:${nextDay(endDate)}`];
  const start = `${day(startDate)}T${clock(startTime ?? '00:00')}`;
  const end = endTime ? `${day(endDate)}T${clock(endTime)}` : `${nextDay(endDate)}T000000`;
  return [`DTSTART;TZID=${CLUB_TIME_ZONE}:${start}`, `DTEND;TZID=${CLUB_TIME_ZONE}:${end}`];
};

const text = (name: string, value: string | undefined) => (value?.trim() ? [`${name}:${escapeText(value)}`] : []);

const location = (venue: IcsVenue | undefined) => venue && [venue.name, venue.address].filter(Boolean).join(', ');

const statusLines = (status: IcsStatus | undefined) => {
  if (!status) return [];
  return status === IcsStatus.enum.CANCELLED ? [`STATUS:${status}`, 'TRANSP:TRANSPARENT'] : [`STATUS:${status}`];
};

const eventLines = (event: IcsEvent, stamp: string) => [
  'BEGIN:VEVENT',
  `UID:${event.id}@${UID_DOMAIN}`,
  `DTSTAMP:${stamp}`,
  ...timing(event),
  `SUMMARY:${escapeText(event.title)}`,
  ...statusLines(event.status),
  ...text('LOCATION', location(event.venue)),
  ...text('DESCRIPTION', event.description),
  ...(event.url ? [`URL:${event.url}`] : []),
  'END:VEVENT',
];

const refreshLines = (every: string | undefined) =>
  every ? [`REFRESH-INTERVAL;VALUE=DURATION:${every}`, `X-PUBLISHED-TTL:${every}`] : [];

export const calendarFile = (events: readonly IcsEvent[], name?: string, refreshEvery?: string) => {
  const stamp = dayjs.utc().format('YYYYMMDD[T]HHmmss[Z]');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bygdo Badmintonklubb//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...text('X-WR-CALNAME', name),
    `X-WR-TIMEZONE:${CLUB_TIME_ZONE}`,
    ...refreshLines(refreshEvery),
    ...VTIMEZONE,
    ...events.flatMap((event) => eventLines(event, stamp)),
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join(CRLF)}${CRLF}`;
};
