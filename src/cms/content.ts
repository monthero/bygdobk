import { useLingui } from '@lingui/react';
import {
  queryOptions,
  useQuery,
  useSuspenseQuery,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { z } from 'zod';

import { Group, GroupStatus, PlanAudience, PriceKind } from '~/data/club';
import { TOPIC_ID } from '~/data/contact';
import { allowsShifts, EventKind, Team } from '~/data/events';
import { InternalPath, NewsKind } from '~/data/news';
import { NoticeTone } from '~/data/notice';
import { PhotoSlot } from '~/data/photos';
import { SocialPlatform } from '~/data/socials';
import { PerkIcon } from '~/data/sponsors';
import { currentLocale } from '~/i18n/current';
import { contentLocaleParams, LOCALES, type Locale } from '~/i18n/locales';

import { sanityQuery } from './client';
import { CONTENT_SCOPE } from './preview/mode';
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
  author: opt(z.string().min(1)),
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
    banner: opt(Image).catch(undefined),
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

const Club = z.object({
  email: lenient(z.email()),
  venue: lenient(Venue),
  orgNr: lenient(z.string().min(1)),
  whistleblowingUrl: lenient(WebUrl),
  spondCode: lenient(z.string().regex(/^[A-Za-z0-9]{4,8}$/)),
});

const NO_CLUB = Club.parse({});

const Payment = z.object({
  vipps: lenient(z.string().regex(/^\d{4,6}$/)),
  accountNumber: lenient(z.string().min(1)),
  instructions: lenient(LocaleString.min(1)),
});

const NO_PAYMENT = Payment.parse({});

const ContactTopicItem = z.object({ id: z.string().regex(TOPIC_ID), label: LocaleString.min(1) });

const LocaleAlt = z.partialRecord(z.enum(LOCALES), z.string());

const SlotPhoto = Photo.extend({ alt: opt(LocaleAlt).catch(undefined) });
export type SlotPhoto = z.output<typeof SlotPhoto>;

const SitePhotos = z
  .object(Object.fromEntries(PhotoSlot.options.map((slot) => [slot, lenient(SlotPhoto)])))
  .nullish()
  .transform((photos): Partial<Record<PhotoSlot, SlotPhoto>> => photos ?? {})
  .catch({});

const TrainingGroup = z.object({
  key: Group,
  name: LocaleString.min(1),
  who: opt(LocaleString),
  coached: flag,
  status: GroupStatus.catch(GroupStatus.enum.open),
  statusNote: opt(LocaleString),
});

const VolunteerTeam = z.object({ key: Team, name: LocaleString.min(1), what: opt(LocaleString) });

const Perk = z.object({
  _key: z.string(),
  icon: PerkIcon.catch(PerkIcon.enum.tag),
  value: LocaleString,
  label: LocaleString,
});

const Sponsor = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.url({ protocol: /^https$/ }),
  inStrip: z
    .boolean()
    .nullish()
    .transform((v) => v ?? true),
  stripText: opt(LocaleString),
  logo: z.object({ url: z.url(), width: z.number().positive(), height: z.number().positive() }),
  deal: lenient(
    z.object({
      intro: opt(LocaleString),
      howTo: opt(LocaleString),
      askForCode: flag,
      perks: listOf('perk', Perk),
    }),
  ),
});

const RawContent = z.object({
  notice: Notice.nullish()
    .transform((n) => n ?? NO_NOTICE)
    .catch(NO_NOTICE),
  socials: listOf('social link', Social),
  club: Club.nullish()
    .transform((c) => c ?? NO_CLUB)
    .catch(NO_CLUB),
  payment: Payment.nullish()
    .transform((p) => p ?? NO_PAYMENT)
    .catch(NO_PAYMENT),
  contactTopics: listOf('contact topic', ContactTopicItem),
  photos: SitePhotos,
  groups: listOf('training group', TrainingGroup),
  teams: listOf('volunteer team', VolunteerTeam),
  sponsors: listOf('sponsor', Sponsor),
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
export type Club = SiteContent['club'];
export type Sponsor = SiteContent['sponsors'][number];
export type TrainingGroup = SiteContent['groups'][number];
export type VolunteerTeam = SiteContent['teams'][number];

const STALE_TIME = 5 * 60_000;

const contentKey = (locale: Locale) => [CONTENT_SCOPE, 'content', locale] as const;

export const contentQuery = (locale: Locale) =>
  queryOptions({
    queryKey: contentKey(locale),
    queryFn: async ({ signal }) =>
      RawContent.parse(await sanityQuery(CONTENT_GROQ, { params: contentLocaleParams(locale), signal })),
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

const privacyKey = (locale: Locale) => [CONTENT_SCOPE, 'privacyPage', locale] as const;

export const privacyPageQuery = (locale: Locale) =>
  queryOptions({
    queryKey: privacyKey(locale),
    queryFn: async ({ signal }) => {
      const parsed = RawPrivacyPage.safeParse(
        await sanityQuery(PRIVACY_GROQ, { params: contentLocaleParams(locale), signal }),
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
    queryKey: [CONTENT_SCOPE, 'newsBody', slug, locale] as const,
    queryFn: async ({ signal }) => {
      const result = await sanityQuery(NEWS_BODY_GROQ, { params: { ...contentLocaleParams(locale), slug }, signal });
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

const newsBodiesKey = (locale: Locale) => [CONTENT_SCOPE, 'newsBodies', locale] as const;

const newsBodiesQuery = (locale: Locale) =>
  queryOptions({
    queryKey: newsBodiesKey(locale),
    queryFn: async ({ signal }) =>
      NewsBodies.parse(await sanityQuery(NEWS_BODIES_GROQ, { params: contentLocaleParams(locale), signal })),
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
