import Fuse, { type FuseResultMatch, type IFuseOptions } from 'fuse.js';
import { z } from 'zod';

import type { NewsPost } from '~/cms/content';

const SearchKey = z.enum(['title', 'summary', 'body']);

// Fuse's ignoreDiacritics maps ø to o but leaves æ alone.
const AE = /[æÆ]/g;
const AE_CHARS = new Set(['æ', 'Æ']);
const fold = (text: string) => text.replace(AE, 'ae');

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

const SEARCH_OPTIONS: IFuseOptions<NewsPost> = {
  keys: [
    { name: SearchKey.enum.title, weight: 3, getFn: (p) => fold(p.title) },
    { name: SearchKey.enum.summary, weight: 2, getFn: (p) => fold(p.summary) },
    { name: SearchKey.enum.body, weight: 1, getFn: (p) => fold(bodyText(p.body)) },
  ],
  threshold: 0.35,
  ignoreLocation: true,
  ignoreDiacritics: true,
  minMatchCharLength: 2,
  includeMatches: true,
  useTokenSearch: true,
  tokenMatch: 'all',
};

type NewsSearch = Fuse<NewsPost>;
export type NewsHit = { post: NewsPost; highlight: string[] };

const NO_TERMS: string[] = [];

const titleTerms = (title: string, matches: readonly FuseResultMatch[] = []) => {
  const ranges = matches.find((m) => m.key === SearchKey.enum.title)?.indices;
  if (!ranges) return NO_TERMS;
  const origin = title.split('').flatMap((ch, i) => (AE_CHARS.has(ch) ? [i, i] : [i]));
  return ranges.map(([start, end]) => title.slice(origin.at(start) ?? start, (origin.at(end) ?? end) + 1));
};

export const createNewsSearch = (posts: readonly NewsPost[]): NewsSearch => new Fuse(posts, SEARCH_OPTIONS);

export const searchNews = (search: NewsSearch, query: string): NewsHit[] =>
  search.search(fold(query)).map(({ item, matches }) => ({ post: item, highlight: titleTerms(item.title, matches) }));
