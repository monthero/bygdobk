import { useLingui } from '@lingui/react';
import { useDocumentTitle } from '@mantine/hooks';

import { PAGE_META, type PagePath } from '~/components/seo/pageMeta';
import { CLUB } from '~/data/club';
import { DEFAULT_LOCALE, isLocale } from '~/i18n/locales';

export const usePageTitle = (page: string | undefined, section?: string) =>
  useDocumentTitle(page ? [page, section, CLUB.name].filter(Boolean).join(' - ') : '');

export const usePageMetaTitle = (path: PagePath) => {
  const { i18n } = useLingui();
  useDocumentTitle(PAGE_META[path][isLocale(i18n.locale) ? i18n.locale : DEFAULT_LOCALE].title);
};
