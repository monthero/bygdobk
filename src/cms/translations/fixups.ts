import type { Locale } from '../../i18n/locales.ts';

type Fix = readonly [wrong: string, right: string];

const FIXES: Partial<Record<Locale, readonly Fix[]>> = {
  sv: [['utbildning', 'träning']],
  fi: [['koulutu', 'harjoitu']],
  zh: [['培训', '训练']],
};

const WITHOUT_WORD_BOUNDARY = new Set<Locale>(['zh']);

const escape = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const PATTERNS = new Map(
  Object.entries(FIXES).map(([locale, fixes]) => {
    const start = WITHOUT_WORD_BOUNDARY.has(locale as Locale) ? '' : String.raw`(?<!\p{L})`;
    const rights = new Map(fixes.map(([wrong, right]) => [wrong.toLowerCase(), right]));
    const pattern = new RegExp(`${start}(${fixes.map(([wrong]) => escape(wrong)).join('|')})`, 'giu');
    return [locale, { pattern, rights }] as const;
  }),
);

const withCaseOf = (found: string, right: string) =>
  found.at(0) === found.at(0)?.toLowerCase() ? right : `${right.charAt(0).toUpperCase()}${right.slice(1)}`;

export const fixUp = (locale: Locale, text: string) => {
  const fixes = PATTERNS.get(locale);
  if (!fixes) return text;
  return text.replace(fixes.pattern, (found) => withCaseOf(found, fixes.rights.get(found.toLowerCase()) ?? found));
};
