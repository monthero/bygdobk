import Fuse, { type FuseResultMatch, type IFuseOptions } from 'fuse.js';
import { z } from 'zod';

import type { NewsBodies, NewsPost } from '~/cms/content';
import { AE_CHARS, foldAe as fold } from '~/utils/search';

const SearchKey = z.enum(['title', 'summary', 'body']);

const BodyBlock = z.object({
  title: z.string().nullish(),
  text: z.string().nullish(),
  cite: z.string().nullish(),
  children: z.array(z.object({ text: z.string() }).catch({ text: '' })).nullish(),
});

const blockText = (block: unknown) => {
  const parsed = BodyBlock.safeParse(block);
  if (!parsed.success) return '';
  const { title, text, cite, children } = parsed.data;
  return [title, children?.map((c) => c.text).join(''), text, cite].filter(Boolean).join(' ');
};

const bodyText = (body: readonly unknown[]) => body.map(blockText).join('\n');

type SearchItem = { post: NewsPost; body: string };

const SEARCH_OPTIONS: IFuseOptions<SearchItem> = {
  keys: [
    { name: SearchKey.enum.title, weight: 3, getFn: (i) => fold(i.post.title) },
    { name: SearchKey.enum.summary, weight: 2, getFn: (i) => fold(i.post.summary) },
    { name: SearchKey.enum.body, weight: 1, getFn: (i) => i.body },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  ignoreDiacritics: true,
  minMatchCharLength: 2,
  includeMatches: true,
  useTokenSearch: true,
  tokenMatch: 'all',
};

type NewsSearch = Fuse<SearchItem>;
export type NewsHit = { post: NewsPost; highlight: string[] };

const NO_TERMS: string[] = [];

const titleTerms = (title: string, matches: readonly FuseResultMatch[] = []) => {
  const ranges = matches.find((m) => m.key === SearchKey.enum.title)?.indices;
  if (!ranges) return NO_TERMS;
  const origin = title.split('').flatMap((ch, i) => (AE_CHARS.has(ch) ? [i, i] : [i]));
  return ranges.map(([start, end]) => title.slice(origin.at(start) ?? start, (origin.at(end) ?? end) + 1));
};

export const createNewsSearch = (posts: readonly NewsPost[], bodies: NewsBodies = []): NewsSearch => {
  const bySlug = new Map(bodies.map((b) => [b.slug, b.body]));
  const items = posts.map((post) => ({ post, body: fold(bodyText(bySlug.get(post.slug) ?? [])) }));
  return new Fuse(items, SEARCH_OPTIONS);
};

export const searchNews = (search: NewsSearch, query: string): NewsHit[] =>
  search
    .search(fold(query))
    .map(({ item, matches }) => ({ post: item.post, highlight: titleTerms(item.post.title, matches) }));
