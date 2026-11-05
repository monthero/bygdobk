import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

import { CLUB, closureById, ClosureId } from '~/data/club';
import { eventBySlug, isPast } from '~/data/events';
import { PHOTOS, PhotoName } from '~/data/photos';
import { slugMap } from '~/utils/slugs';

export const NewsKind = z.enum(['training', 'event', 'volunteer', 'club']);
export type NewsKind = z.infer<typeof NewsKind>;

export const NEWS_KINDS: Record<NewsKind, MessageDescriptor> = {
  [NewsKind.enum.training]: msg({ message: 'Training', comment: 'News category' }),
  [NewsKind.enum.event]: msg({ message: 'Event', comment: 'News category' }),
  [NewsKind.enum.volunteer]: msg({ message: 'Volunteering', comment: 'News category. Norwegian: Dugnad' }),
  [NewsKind.enum.club]: msg({ message: 'Club', comment: 'News category' }),
};

export const NEWS_KIND_SLUGS = slugMap<NewsKind>({
  [NewsKind.enum.training]: 'trening',
  [NewsKind.enum.event]: 'arrangement',
  [NewsKind.enum.volunteer]: 'dugnad',
  [NewsKind.enum.club]: 'klubben',
});

export const InternalPath = z.enum(['/trening', '/arrangementer', '/klubben', '/kontakt']);
export type InternalPath = z.infer<typeof InternalPath>;

export const NewsAuthor = z.enum(['board']);
export type NewsAuthor = z.infer<typeof NewsAuthor>;

type Author = { name: MessageDescriptor; role: MessageDescriptor; page: InternalPath; hash?: string };

export const NEWS_AUTHORS: Record<NewsAuthor, Author> = {
  [NewsAuthor.enum.board]: {
    name: msg({ message: 'The board', comment: 'Author of a news post: the club board. Norwegian: Styret' }),
    role: msg({ message: 'Bygdø Badmintonklubb', comment: 'Role under the author name of a news post' }),
    page: InternalPath.enum['/klubben'],
    hash: 'styret',
  },
};

export const BlockType = z.enum(['paragraph', 'heading', 'list', 'callout', 'quote']);
export type BlockType = z.infer<typeof BlockType>;

const Message = z.custom<MessageDescriptor>(
  (value) => typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string',
  'Expected a Lingui message descriptor',
);

const NewsBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal(BlockType.enum.paragraph), text: Message }),
  z.object({ type: z.literal(BlockType.enum.heading), text: Message }),
  z.object({ type: z.literal(BlockType.enum.list), items: z.array(Message).min(1) }),
  z.object({ type: z.literal(BlockType.enum.callout), title: Message.optional(), text: Message }),
  z.object({ type: z.literal(BlockType.enum.quote), text: Message, cite: Message.optional() }),
]);
export type NewsBlock = z.infer<typeof NewsBlock>;

const NewsLink = z.union([
  z.object({ label: Message, to: InternalPath, hash: z.string().optional() }),
  z.object({ label: Message, href: z.url() }),
]);
export type NewsLink = z.infer<typeof NewsLink>;

const SLUG = /^[a-z0-9-]+$/;

const NewsArticle = z.object({
  id: z.string().regex(SLUG),
  date: z.iso.date(),
  kind: NewsKind,
  title: Message,
  summary: Message,
  body: z.array(NewsBlock).min(1),
  cover: PhotoName.transform((name) => PHOTOS[name]),
  author: NewsAuthor,
  event: z
    .string()
    .refine((slug) => eventBySlug(slug) !== undefined, 'Unknown event slug')
    .optional(),
  closure: ClosureId.optional(),
  links: z.array(NewsLink).optional(),
});
export type NewsPost = z.output<typeof NewsArticle>;

const NewsArchive = z
  .array(NewsArticle)
  .refine((posts) => new Set(posts.map((p) => p.id)).size === posts.length, 'Duplicate news slug')
  .transform((posts) => posts.toSorted((a, b) => b.date.localeCompare(a.date)));

const TRAINING_LINK = { label: msg`See training times`, to: InternalPath.enum['/trening'] };
const BOARD_LINK = { label: msg`Meet the board`, to: InternalPath.enum['/klubben'], hash: 'styret' };

const POSTS = [
  {
    id: 'hosttreff-2026',
    date: '2026-10-21',
    kind: NewsKind.enum.volunteer,
    title: msg`Høsttreff 2026: we need your help`,
    summary: msg`Our autumn tournament runs on volunteers. Grab a shift in the hall, kiosk or secretariat.`,
    cover: PhotoName.enum.hallSunset,
    author: NewsAuthor.enum.board,
    event: 'hosttreff-2026',
    body: [
      {
        type: BlockType.enum.paragraph,
        text: msg`Høsttreff only works when lots of us lend a hand. Pick a shift that suits you.`,
      },
    ],
  },
  {
    id: 'autumn-break-2026',
    date: '2026-09-25',
    kind: NewsKind.enum.training,
    title: msg`No training during the autumn break`,
    summary: msg`No organized training during the autumn break.`,
    cover: PhotoName.enum.racketCourt,
    author: NewsAuthor.enum.board,
    closure: ClosureId.enum['autumn-break-2026'],
    links: [TRAINING_LINK],
    body: [{ type: BlockType.enum.paragraph, text: msg`The rackets get a short rest during the autumn break.` }],
  },
  {
    id: 'season-start-2026',
    date: '2026-08-19',
    kind: NewsKind.enum.training,
    title: msg`Training has started again`,
    summary: msg`Welcome back! Training times are the same as last season.`,
    cover: PhotoName.enum.playerServe,
    author: NewsAuthor.enum.board,
    links: [TRAINING_LINK],
    body: [
      {
        type: BlockType.enum.paragraph,
        text: msg`The new season is on, and the courts at Bygdøhus are busy again. Same days, same times as last season.`,
      },
      {
        type: BlockType.enum.callout,
        title: msg`Join us in Spond`,
        text: msg`Join the club’s group in Spond to see the status of each session.`,
      },
    ],
  },
  {
    id: 'summer-break-2026',
    date: '2026-06-20',
    kind: NewsKind.enum.training,
    title: msg`Summer break`,
    summary: msg`No training over the summer. See you after the break!`,
    cover: PhotoName.enum.shuttleRacket,
    author: NewsAuthor.enum.board,
    closure: ClosureId.enum['summer-2026'],
    links: [TRAINING_LINK],
    body: [
      {
        type: BlockType.enum.paragraph,
        text: msg`Thanks for a great season! The hall is quiet now, and there is no training over the summer.`,
      },
    ],
  },
  {
    id: 'vartreff-volunteers-2026',
    date: '2026-04-20',
    kind: NewsKind.enum.volunteer,
    title: msg`Volunteers for Vårtreff`,
    summary: msg`Vårtreff needs helping hands in the hall, kiosk and secretariat.`,
    cover: PhotoName.enum.playersCourt,
    author: NewsAuthor.enum.board,
    body: [{ type: BlockType.enum.paragraph, text: msg`Many hands make light work. Can you give us a few hours?` }],
  },
  {
    id: 'annual-meeting-2026',
    date: '2026-03-10',
    kind: NewsKind.enum.club,
    title: msg`Annual meeting 2026`,
    summary: msg`All members are welcome at the annual meeting.`,
    cover: PhotoName.enum.racketCourt,
    author: NewsAuthor.enum.board,
    links: [BOARD_LINK],
    body: [
      {
        type: BlockType.enum.paragraph,
        text: msg`The annual meeting is where members have their say about the club. Come along and make your voice heard.`,
      },
      {
        type: BlockType.enum.callout,
        title: msg`Questions?`,
        text: msg`Email the board at ${CLUB.email}.`,
      },
    ],
  },
  {
    id: 'nm-rigging-2026',
    date: '2026-01-15',
    kind: NewsKind.enum.training,
    title: msg`No training during the championship setup`,
    summary: msg`The hall is being set up for the national championships, so there is no training that day.`,
    cover: PhotoName.enum.playersCourt,
    author: NewsAuthor.enum.board,
    closure: ClosureId.enum['nm-rigging-2026'],
    links: [TRAINING_LINK],
    body: [
      {
        type: BlockType.enum.paragraph,
        text: msg`Big things are happening at Bygdøhus: the hall is being set up for the national championships.`,
      },
    ],
  },
] satisfies z.input<typeof NewsArchive>;

export const NEWS: NewsPost[] = NewsArchive.parse(POSTS);

export const newsBySlug = (slug: string) => NEWS.find((p) => p.id === slug);

export const isExpired = (post: NewsPost, todayIso: string) => {
  const event = post.event ? eventBySlug(post.event) : undefined;
  if (event && isPast(event, todayIso)) return true;
  const closure = post.closure ? closureById(post.closure) : undefined;
  return closure !== undefined && closure.to < todayIso;
};

export const currentPosts = (posts: NewsPost[], todayIso: string) => {
  const fresh = posts.filter((p) => !isExpired(p, todayIso));
  return fresh.length ? fresh : posts;
};

export const NEWS_KINDS_IN_USE: NewsKind[] = NewsKind.options.filter((k) => NEWS.some((p) => p.kind === k));
