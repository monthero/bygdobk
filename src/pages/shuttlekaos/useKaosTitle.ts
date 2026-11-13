import { useDocumentTitle } from '@mantine/hooks';

import { BRAND } from './labels';

export const useKaosTitle = (page?: string) => useDocumentTitle(page ? `${page} - ${BRAND}` : BRAND);
