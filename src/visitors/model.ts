import { z } from 'zod';

import { LOCALES } from '~/i18n/locales';
import { date, ISO_DAY, today, type Dayjs } from '~/utils/dates';

export const VisitDevice = z.enum(['phone', 'tablet', 'computer']);
export type VisitDevice = z.infer<typeof VisitDevice>;

export const VisitPeriod = z.enum(['uke', 'maned', 'ar']);
export type VisitPeriod = z.infer<typeof VisitPeriod>;

export const DEFAULT_PERIOD = VisitPeriod.enum.maned;

export const Bucket = z.enum(['day', 'month']);
export type Bucket = z.infer<typeof Bucket>;

const Views = z.number().int().nonnegative();

export const VisitReport = z.object({
  views: Views,
  fromOtherSites: Views,
  days: z.array(z.object({ day: z.iso.date(), views: Views })),
  pages: z.array(z.object({ path: z.string(), views: Views })),
  referrers: z.array(z.object({ host: z.string(), views: Views })),
  devices: z.array(z.object({ device: VisitDevice, views: Views })),
  languages: z.array(z.object({ language: z.enum(LOCALES), views: Views })),
});
export type VisitReport = z.infer<typeof VisitReport>;

export type PeriodRange = { from: Dayjs; to: Dayjs; bucket: Bucket };

export const periodRange = (period: VisitPeriod): PeriodRange => {
  const to = today();
  if (period === VisitPeriod.enum.ar) {
    return { from: to.subtract(11, 'month').startOf('month'), to, bucket: Bucket.enum.month };
  }
  return { from: to.subtract(period === VisitPeriod.enum.uke ? 6 : 29, 'day'), to, bucket: Bucket.enum.day };
};

const BUCKET_KEY: Record<Bucket, string> = { [Bucket.enum.day]: ISO_DAY, [Bucket.enum.month]: 'YYYY-MM' };

export const viewsOverTime = (days: VisitReport['days'], { from, to, bucket }: PeriodRange) => {
  const format = BUCKET_KEY[bucket];
  const totals = new Map<string, number>();
  for (const { day, views } of days) {
    const key = date(day).format(format);
    totals.set(key, (totals.get(key) ?? 0) + views);
  }
  const points: { start: Dayjs; views: number }[] = [];
  for (let start = from.startOf(bucket); !start.isAfter(to); start = start.add(1, bucket)) {
    points.push({ start, views: totals.get(start.format(format)) ?? 0 });
  }
  return points;
};
