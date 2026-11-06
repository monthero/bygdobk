import { useDocumentTitle } from '@mantine/hooks';

import { CLUB } from '~/data/club';

export const usePageTitle = (page: string | undefined, section?: string) =>
  useDocumentTitle(page ? [page, section, CLUB.name].filter(Boolean).join(' - ') : '');
