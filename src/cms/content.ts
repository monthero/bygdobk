import { useLingui } from '@lingui/react';
import { queryOptions, useSuspenseQuery, type UseSuspenseQueryOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { Group, PlanAudience, PriceKind } from '~/data/club';
import { allowsShifts, EventKind, Team } from '~/data/events';
import { InternalPath, NewsKind } from '~/data/news';
import { NoticeTone } from '~/data/notice';
import { currentLocale } from '~/i18n/current';
import { CONTENT_FALLBACK, DEFAULT_LOCALE, LOCALES, type Locale } from '~/i18n/locales';

import { sanity } from './client';
import { queryClient } from './queryClient';

const opt = <T extends z.ZodType>(schema: T) => schema.nullish().transform((v) => v ?? undefined);

const flag = z
  .boolean()
  .nullish()
  .transform((v) => v ?? false);

const localeOf = <T extends z.ZodType>(value: T) =>
  z.object({
    nb: value,
    en: opt(value),
    sv: opt(value),
    da: opt(value),
    fi: opt(value),
    is: opt(value),
    zh: opt(value),
  });

const listOf = <T extends z.ZodType>(name: string, item: T) =>
  z
    .array(z.unknown())
    .nullish()
    .transform((items) =>
      (items ?? []).flatMap((raw): z.output<T>[] => {
        const parsed = item.safeParse(raw);
        if (parsed.success) return [parsed.data];
        console.warn(`Skipped an invalid ${name} from Sanity`, z.prettifyError(parsed.error));
        return [];
      }),
    );

const IsoDay = z.iso.date();
const Time = z.string().regex(/^\d{2}:\d{2}$/);

const LocaleString = localeOf(z.string());
const Blocks = z.array(z.looseObject({ _type: z.string(), _key: z.string() }));

const Photo = z.looseObject({
  asset: z.object({ _ref: z.string() }),
  hotspot: opt(z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() })),
  crop: opt(z.object({ top: z.number(), bottom: z.number(), left: z.number(), right: z.number() })),
});

const Image = Photo.extend({ alt: LocaleString, lqip: opt(z.string()) });

const Notice = z.object({
  visible: flag,
  tone: NoticeTone.catch(NoticeTone.enum.info),
  text: opt(LocaleString),
});

const NO_NOTICE = Notice.parse({});

const NewsLink = z.object({
  _key: z.string(),
  label: LocaleString,
  page: opt(InternalPath),
  hash: opt(z.string()),
  url: opt(z.url()),
});

const NewsPost = z.object({
  slug: z.string().min(1),
  date: IsoDay,
  kind: NewsKind,
  title: LocaleString,
  summary: LocaleString,
  banner: opt(Image).catch(undefined),
  body: localeOf(Blocks),
  eventId: opt(z.string()),
  links: listOf('news link', NewsLink),
});

const Shift = z.object({
  _key: z.string(),
  team: Team,
  day: IsoDay,
  start: Time,
  end: opt(Time),
  spots: z.number().int().min(1),
  setup: flag,
});

const Recurrence = z.object({
  weekdays: z.array(z.number().int().min(1).max(7)).min(1),
  until: IsoDay,
});

const WebUrl = z.url({ protocol: /^https?$/ });

const lenient = <T extends z.ZodType>(schema: T) => opt(schema).catch(undefined);

const Venue = z.object({ name: z.string().min(1), address: opt(z.string().min(1)), mapUrl: lenient(WebUrl) });

const Event = z
  .object({
    id: z.string().min(1),
    kind: EventKind,
    slug: opt(z.string().min(1)),
    title: opt(LocaleString),
    group: opt(Group),
    groups: opt(z.array(Group)).transform((g) => g ?? []),
    startDate: IsoDay,
    endDate: opt(IsoDay),
    dateConfirmed: z
      .boolean()
      .nullish()
      .transform((v) => v ?? true),
    whenText: opt(LocaleString),
    startTime: opt(Time),
    endTime: opt(Time),
    recurrence: opt(Recurrence),
    description: opt(LocaleString),
    ownEvent: flag,
    tip: opt(z.object({ title: LocaleString, text: LocaleString })),
    venue: lenient(Venue),
    registrationDeadline: lenient(z.iso.datetime({ offset: true })),
    registrationUrl: lenient(WebUrl),
    signupUrl: opt(z.url()),
    shifts: listOf('shift', Shift),
  })
  .refine(
    (e) =>
      e.kind === EventKind.enum.training
        ? Boolean(e.group && e.startTime && e.endTime && e.recurrence)
        : Boolean(e.title && (e.kind === EventKind.enum.break || e.slug)),
    'Training needs a group, times and weekly days; other events need a title (and a URL name unless it is a break)',
  )
  .transform((e) => (allowsShifts(e) ? e : { ...e, signupUrl: undefined, shifts: [] }));

const Plan = z.object({
  id: z.string().min(1),
  kind: PriceKind,
  audience: PlanAudience.catch(PlanAudience.enum.all),
  group: opt(Group),
  name: LocaleString,
  note: LocaleString,
  membership: z.number().min(0),
  training: z.number().min(0),
  perVisit: opt(z.number().min(0)),
});

const Discount = z.object({ title: LocaleString, body: LocaleString });

const BoardMember = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: LocaleString,
  photo: Photo,
  email: z.email(),
  phone: opt(z.string().regex(/^\d{8}$/)),
});

const RawContent = z.object({
  notice: Notice.nullish()
    .transform((n) => n ?? NO_NOTICE)
    .catch(NO_NOTICE),
  news: listOf('news post', NewsPost),
  events: listOf('event', Event),
  plans: listOf('membership plan', Plan),
  discounts: listOf('discount', Discount),
  board: listOf('board member', BoardMember),
});
type RawContent = z.output<typeof RawContent>;

const CONTENT_GROQ = `{
  "notice": *[_id == "siteSettings"][0].notice,
  "news": *[_type == "newsPost"] | order(date desc) {
    "slug": slug.current, date, kind, title, summary, body, links,
    "banner": banner { ..., "lqip": asset->metadata.lqip },
    "eventId": event._ref
  },
  "events": *[_type == "event"] | order(startDate asc) {
    "id": _id, kind, "slug": slug.current, title, group, groups, startDate, endDate, dateConfirmed, whenText,
    startTime, endTime, recurrence, description, ownEvent, tip, venue, registrationDeadline, registrationUrl,
    signupUrl, shifts
  },
  "plans": *[_type == "membershipPlan"] | order(order asc) {
    "id": slug.current, kind, audience, group, name, note, membership, training, perVisit
  },
  "discounts": *[_type == "discount"] | order(order asc) { title, body },
  "board": *[_type == "boardMember"] | order(order asc) { "id": _id, name, role, photo, email, phone }
}`;

const fetchContent = async ({ signal }: { signal: AbortSignal }) =>
  RawContent.parse(await sanity.fetch<unknown>(CONTENT_GROQ, {}, { signal }));

const CONTENT_KEY = ['content'] as const;
const STALE_TIME = 5 * 60_000;

export const contentQuery = queryOptions({ queryKey: CONTENT_KEY, queryFn: fetchContent, staleTime: STALE_TIME });

const RawPrivacyPage = z.object({ title: LocaleString, body: localeOf(Blocks), updatedAt: opt(IsoDay) }).nullable();
type RawPrivacyPage = z.output<typeof RawPrivacyPage>;

const PRIVACY_GROQ = `*[_id == "privacyPage"][0] { title, body, updatedAt }`;

const fetchPrivacyPage = async ({ signal }: { signal: AbortSignal }) => {
  const parsed = RawPrivacyPage.safeParse(await sanity.fetch<unknown>(PRIVACY_GROQ, {}, { signal }));
  if (parsed.success) return parsed.data;
  console.warn('Skipped an invalid privacy page from Sanity', z.prettifyError(parsed.error));
  return null;
};

const PRIVACY_KEY = ['privacyPage'] as const;

export const privacyPageQuery = queryOptions({
  queryKey: PRIVACY_KEY,
  queryFn: fetchPrivacyPage,
  staleTime: STALE_TIME,
});

type LocaleValue<V> = { nb: V; en?: V; sv?: V; da?: V; fi?: V; is?: V; zh?: V };

type Localized<T> =
  T extends LocaleValue<infer V>
    ? V
    : T extends readonly (infer U)[]
      ? Localized<U>[]
      : T extends object
        ? { [K in keyof T]: Localized<T[K]> }
        : T;

export type SiteContent = Localized<RawContent>;
export type NewsPost = SiteContent['news'][number];
export type CmsImageData = Localized<z.output<typeof Image>>;
export type ArticleBlocks = z.output<typeof Blocks>;
export type PrivacyPage = Localized<RawPrivacyPage>;

export type BoardMember = SiteContent['board'][number];
export type Plan = SiteContent['plans'][number];

const LOCALE_KEYS = new Set<string>(LOCALES);

const isLocaleValue = (value: object): value is LocaleValue<unknown> =>
  'nb' in value && Object.keys(value).every((key) => LOCALE_KEYS.has(key));

const isFilled = (value: unknown) => {
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null;
};

const localizeValue = (value: unknown, locale: Locale): unknown => {
  if (Array.isArray(value)) return value.map((item) => localizeValue(item, locale));
  if (typeof value !== 'object' || value === null) return value;
  if (isLocaleValue(value)) {
    for (const candidate of [locale, CONTENT_FALLBACK[locale]]) {
      if (isFilled(value[candidate])) return value[candidate];
    }
    return value[DEFAULT_LOCALE];
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localizeValue(item, locale)]));
};

const localize = <T>(value: T, locale: Locale) => localizeValue(value, locale) as Localized<T>;

export const loadSiteContent = async () => localize(await queryClient.ensureQueryData(contentQuery), currentLocale());

const localeSelects = <T>() => {
  const selects = new Map<Locale, (raw: T) => Localized<T>>();
  return (locale: Locale) => {
    const existing = selects.get(locale);
    if (existing) return existing;
    const select = (raw: T) => localize(raw, locale);
    selects.set(locale, select);
    return select;
  };
};

const contentSelect = localeSelects<RawContent>();
const privacySelect = localeSelects<RawPrivacyPage>();

type ContentOptions = Omit<
  UseSuspenseQueryOptions<RawContent, Error, SiteContent, typeof CONTENT_KEY>,
  'queryKey' | 'queryFn' | 'select'
>;

export const useSiteContent = (options?: ContentOptions) => {
  useLingui();
  return useSuspenseQuery({ ...contentQuery, select: contentSelect(currentLocale()), ...options }).data;
};

type PrivacyPageOptions = Omit<
  UseSuspenseQueryOptions<RawPrivacyPage, Error, PrivacyPage, typeof PRIVACY_KEY>,
  'queryKey' | 'queryFn' | 'select'
>;

export const usePrivacyPage = (options?: PrivacyPageOptions) => {
  useLingui();
  return useSuspenseQuery({ ...privacyPageQuery, select: privacySelect(currentLocale()), ...options }).data;
};
