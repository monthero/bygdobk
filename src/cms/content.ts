import { useLingui } from '@lingui/react';
import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { z } from 'zod';

import { Group, PlanAudience, PriceKind } from '~/data/club';
import { allowsShifts, EventKind, Team } from '~/data/events';
import { InternalPath, NewsKind } from '~/data/news';
import { NoticeTone } from '~/data/notice';
import { SocialPlatform } from '~/data/socials';
import { currentLocale } from '~/i18n/current';
import { CONTENT_FALLBACK, type Locale } from '~/i18n/locales';

import { sanityQuery } from './client';
import { CONTENT_GROQ, NEWS_BODIES_GROQ, NEWS_BODY_GROQ, PRIVACY_GROQ } from './queries';
import { queryClient } from './queryClient';

const opt = <T extends z.ZodType>(schema: T) => schema.nullish().transform((v) => v ?? undefined);

const flag = z
  .boolean()
  .nullish()
  .transform((v) => v ?? false);

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

const LocaleString = z.string();
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

const Social = z.object({ platform: SocialPlatform, url: z.url({ protocol: /^https$/ }) });

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
  socials: listOf('social link', Social),
  news: listOf('news post', NewsPost),
  events: listOf('event', Event),
  plans: listOf('membership plan', Plan),
  discounts: listOf('discount', Discount),
  board: listOf('board member', BoardMember),
});
export type SiteContent = z.output<typeof RawContent>;
export type NewsPost = SiteContent['news'][number];
export type CmsImageData = z.output<typeof Image>;
export type ArticleBlocks = z.output<typeof Blocks>;
export type BoardMember = SiteContent['board'][number];
export type Plan = SiteContent['plans'][number];

const STALE_TIME = 5 * 60_000;

const localeParams = (locale: Locale) => ({ locale, fallback: CONTENT_FALLBACK[locale] });

const contentKey = (locale: Locale) => ['content', locale] as const;

export const contentQuery = (locale: Locale) =>
  queryOptions({
    queryKey: contentKey(locale),
    queryFn: async ({ signal }) =>
      RawContent.parse(await sanityQuery(CONTENT_GROQ, { params: localeParams(locale), signal })),
    staleTime: STALE_TIME,
  });

export const loadSiteContent = () => queryClient.ensureQueryData(contentQuery(currentLocale()));

type ContentOptions = Omit<
  UseSuspenseQueryOptions<SiteContent, Error, SiteContent, ReturnType<typeof contentKey>>,
  'queryKey' | 'queryFn'
>;

export const useSiteContent = (options?: ContentOptions) => {
  useLingui();
  return useSuspenseQuery({ ...contentQuery(currentLocale()), ...options }).data;
};

const RawPrivacyPage = z.object({ title: LocaleString, body: Blocks, updatedAt: opt(IsoDay) }).nullable();
export type PrivacyPage = z.output<typeof RawPrivacyPage>;

const privacyKey = (locale: Locale) => ['privacyPage', locale] as const;

export const privacyPageQuery = (locale: Locale) =>
  queryOptions({
    queryKey: privacyKey(locale),
    queryFn: async ({ signal }) => {
      const parsed = RawPrivacyPage.safeParse(
        await sanityQuery(PRIVACY_GROQ, { params: localeParams(locale), signal }),
      );
      if (parsed.success) return parsed.data;
      console.warn('Skipped an invalid privacy page from Sanity', z.prettifyError(parsed.error));
      return null;
    },
    staleTime: STALE_TIME,
  });

type PrivacyPageOptions = Omit<
  UseSuspenseQueryOptions<PrivacyPage, Error, PrivacyPage, ReturnType<typeof privacyKey>>,
  'queryKey' | 'queryFn'
>;

export const usePrivacyPage = (options?: PrivacyPageOptions) => {
  useLingui();
  return useSuspenseQuery({ ...privacyPageQuery(currentLocale()), ...options }).data;
};

const NewsBody = z.object({ body: Blocks.nullish().catch(null) }).nullable();

const NO_BLOCKS: ArticleBlocks = [];

export const newsBodyQuery = (slug: string, locale: Locale) =>
  queryOptions({
    queryKey: ['newsBody', slug, locale] as const,
    queryFn: async ({ signal }) => {
      const result = await sanityQuery(NEWS_BODY_GROQ, { params: { ...localeParams(locale), slug }, signal });
      return NewsBody.parse(result)?.body ?? NO_BLOCKS;
    },
    staleTime: STALE_TIME,
  });

export const useNewsBody = (slug: string) => {
  useLingui();
  return useSuspenseQuery(newsBodyQuery(slug, currentLocale())).data;
};

const NewsBodies = z.array(z.object({ slug: z.string(), body: Blocks.nullish().catch(null) }));
export type NewsBodies = z.output<typeof NewsBodies>;

const newsBodiesKey = (locale: Locale) => ['newsBodies', locale] as const;

const newsBodiesQuery = (locale: Locale) =>
  queryOptions({
    queryKey: newsBodiesKey(locale),
    queryFn: async ({ signal }) =>
      NewsBodies.parse(await sanityQuery(NEWS_BODIES_GROQ, { params: localeParams(locale), signal })),
    staleTime: STALE_TIME,
  });

type NewsBodiesOptions = Omit<
  UseQueryOptions<NewsBodies, Error, NewsBodies, ReturnType<typeof newsBodiesKey>>,
  'queryKey' | 'queryFn'
>;

export const useNewsBodies = (options?: NewsBodiesOptions) => {
  useLingui();
  return useQuery({ ...newsBodiesQuery(currentLocale()), ...options }).data;
};
