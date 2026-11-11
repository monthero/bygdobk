import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useCallback, useMemo } from 'react';

import { useSiteContent } from '~/cms/content';
import { NAV } from '~/components/layout/nav';
import { seasonById } from '~/pages/board/format';

const PAGE_NAMES = new Map<string, MessageDescriptor>([
  ['/', msg({ message: 'Front page', comment: 'Visitor numbers: the home page of the website' })],
  ...NAV.map(({ to, label }): [string, MessageDescriptor] => [to, label]),
  ['/medlemskap/bli-medlem', msg`Join the club`],
  ['/medlemskap/mine', msg`My membership`],
  ['/personvern', msg`Privacy`],
]);

const SEASON_PAGE = /^\/trening\/(\d{4}-\d{2})$/;

export const usePageName = () => {
  const { i18n, t } = useLingui();
  const { news, events } = useSiteContent();
  const titles = useMemo(
    () =>
      new Map<string, string>([
        ...news.map(({ slug, title }): [string, string] => [`/nyheter/${slug}`, title]),
        ...events.flatMap(({ slug, title }): [string, string][] =>
          slug && title ? [[`/arrangementer/${slug}`, title]] : [],
        ),
      ]),
    [news, events],
  );

  return useCallback(
    (path: string) => {
      const known = PAGE_NAMES.get(path);
      if (known) return i18n._(known);
      const title = titles.get(path);
      if (title) return title;
      const seasonId = SEASON_PAGE.exec(path)?.at(1);
      if (seasonId) {
        const season = seasonById(seasonId).label;
        return t({ message: `Training ${season}`, comment: 'Visitor numbers: the training page for one season' });
      }
      return path;
    },
    [i18n, t, titles],
  );
};
