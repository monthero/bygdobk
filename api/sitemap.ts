import { z } from 'zod';

import { VISITOR_KINDS } from '../src/data/eventKinds.js';
import { DEFAULT_LOCALE, LOCALE_META, LOCALES, withLocale, type Locale } from '../src/i18n/locales.js';
import { sanityQuery } from './_sanity.js';

const PAGES = [
  '/',
  '/trening',
  '/medlemskap',
  '/medlemskap/bli-medlem',
  '/arrangementer',
  '/nyheter',
  '/klubben',
  '/kontakt',
  '/personvern',
];

const GROQ = `{
  "news": *[_type == "newsPost" && defined(slug.current)] { "slug": slug.current, "updated": _updatedAt },
  "events": *[_type == "event" && kind in $kinds && defined(slug.current)] { "slug": slug.current, "updated": _updatedAt }
}`;

const Item = z.object({ slug: z.string(), updated: z.string().optional() });
const Content = z.object({ news: z.array(Item).catch([]), events: z.array(Item).catch([]) });

type Entry = { path: string; updated?: string };

const url = (origin: string, path: string, locale: Locale) => `${origin}${withLocale(path, locale)}`;

const entryXml = (origin: string, { path, updated }: Entry) => {
  const href = (locale: Locale) => url(origin, path, locale);
  const alternates = LOCALES.map(
    (locale) => `<xhtml:link rel="alternate" hreflang="${LOCALE_META[locale].lang}" href="${href(locale)}"/>`,
  ).join('');
  const fallback = `<xhtml:link rel="alternate" hreflang="x-default" href="${href(DEFAULT_LOCALE)}"/>`;
  const lastmod = updated ? `<lastmod>${updated.slice(0, 10)}</lastmod>` : '';
  return LOCALES.map((locale) => `<url><loc>${href(locale)}</loc>${lastmod}${alternates}${fallback}</url>`).join('\n');
};

export const GET = async (request: Request) => {
  const { origin } = new URL(request.url);
  const { news, events } = await sanityQuery(Content, GROQ, { kinds: VISITOR_KINDS });
  const entries: Entry[] = [
    ...PAGES.map((path) => ({ path })),
    ...news.map((n) => ({ path: `/nyheter/${n.slug}`, updated: n.updated })),
    ...events.map((e) => ({ path: `/arrangementer/${e.slug}`, updated: e.updated })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map((entry) => entryXml(origin, entry)).join('\n')}
</urlset>
`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
