import { z } from 'zod';

import { DEFAULT_LOCALE, LOCALE_META, localeInPath, stripLocale, type Locale } from '../src/i18n/locales.js';
import { imageBuilder, LocaleText, localized, sanityQuery, VISITOR_KINDS } from './_sanity.js';

const SITE_NAME = 'Bygdø Badmintonklubb';
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;
const DEFAULT_IMAGE_PATH = '/og-image.jpg';
const DETAIL_PATH = /^\/(nyheter|arrangementer)\/([^/]+)$/;

const DESCRIPTIONS: Record<Locale, string> = {
  nb: 'Badminton for alle på Bygdøhus i Oslo. Trening, medlemskap, arrangementer og nyheter fra Bygdø Badmintonklubb.',
  en: 'Badminton for everyone at Bygdøhus in Oslo. Training, membership, events and news from Bygdø Badmintonklubb.',
  sv: 'Badminton för alla på Bygdøhus i Oslo. Träning, medlemskap, evenemang och nyheter från Bygdø Badmintonklubb.',
  da: 'Badminton for alle på Bygdøhus i Oslo. Træning, medlemskab, arrangementer og nyheder fra Bygdø Badmintonklubb.',
  fi: 'Sulkapalloa kaikille Bygdøhusissa Oslossa. Treenit, jäsenyys, tapahtumat ja uutiset Bygdø Badmintonklubbilta.',
  is: 'Badminton fyrir alla í Bygdøhus í Osló. Æfingar, aðild, viðburðir og fréttir frá Bygdø Badmintonklubb.',
  zh: '奥斯陆 Bygdøhus 的羽毛球，人人都能打。Bygdø Badmintonklubb 的训练、会员、活动和新闻。',
};

const NEWS_GROQ = `*[_type == "newsPost" && slug.current == $slug][0] { title, summary, banner }`;
const EVENT_GROQ = `*[_type == "event" && kind in $kinds && slug.current == $slug][0] { title, description }`;

const Detail = z
  .object({ title: LocaleText, summary: LocaleText, description: LocaleText, banner: z.unknown() })
  .partial()
  .nullable();

type Preview = { title: string; description: string; image: string; type: 'website' | 'article' };

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escape = (text: string) => text.replaceAll(/[&<>"]/g, (ch) => ESCAPES[ch] ?? ch);

const Banner = z.object({
  asset: z.object({ _ref: z.string() }),
  crop: z.object({ top: z.number(), bottom: z.number(), left: z.number(), right: z.number() }).optional(),
  hotspot: z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }).optional(),
});

const bannerUrl = (banner: unknown) => {
  const parsed = Banner.safeParse(banner);
  if (!parsed.success) return undefined;
  return imageBuilder.image(parsed.data).width(IMAGE_WIDTH).height(IMAGE_HEIGHT).fit('crop').format('jpg').url();
};

const detailPreview = async (path: string, locale: Locale, defaultImage: string): Promise<Preview | null> => {
  const match = DETAIL_PATH.exec(path);
  if (!match) return null;
  const [, section, slug] = match;
  const isNews = section === 'nyheter';
  const detail = await sanityQuery(Detail, isNews ? NEWS_GROQ : EVENT_GROQ, { slug, kinds: VISITOR_KINDS });
  const title = localized(detail?.title, locale);
  if (!detail || !title) return null;
  return {
    title,
    description: localized(isNews ? detail.summary : detail.description, locale) ?? DESCRIPTIONS[locale],
    image: bannerUrl(detail.banner) ?? defaultImage,
    type: 'article',
  };
};

const page = (preview: Preview, locale: Locale, url: string) => {
  const meta = LOCALE_META[locale];
  const title = preview.title === SITE_NAME ? SITE_NAME : `${preview.title} - ${SITE_NAME}`;
  const tags = [
    ['property', 'og:site_name', SITE_NAME],
    ['property', 'og:type', preview.type],
    ['property', 'og:title', preview.title],
    ['property', 'og:description', preview.description],
    ['property', 'og:url', url],
    ['property', 'og:image', preview.image],
    ['property', 'og:image:width', String(IMAGE_WIDTH)],
    ['property', 'og:image:height', String(IMAGE_HEIGHT)],
    ['property', 'og:locale', meta.intl.replace('-', '_')],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'description', preview.description],
  ]
    .map(([attr, key, value]) => `<meta ${attr}="${key}" content="${escape(value ?? '')}">`)
    .join('\n    ');
  return `<!doctype html>
<html lang="${meta.lang}">
  <head>
    <meta charset="utf-8">
    <title>${escape(title)}</title>
    ${tags}
    <link rel="canonical" href="${escape(url)}">
  </head>
  <body>
    <h1>${escape(preview.title)}</h1>
    <p>${escape(preview.description)}</p>
  </body>
</html>
`;
};

export const GET = async (request: Request) => {
  const { origin, searchParams } = new URL(request.url);
  const path = searchParams.get('path') ?? '/';
  const locale = localeInPath(path) ?? DEFAULT_LOCALE;
  const image = `${origin}${DEFAULT_IMAGE_PATH}`;
  const fallback: Preview = { title: SITE_NAME, description: DESCRIPTIONS[locale], image, type: 'website' };
  const preview = (await detailPreview(stripLocale(path), locale, image).catch(() => null)) ?? fallback;
  return new Response(page(preview, locale, `${origin}${path}`), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400',
    },
  });
};
