import { createFileRoute } from '@tanstack/react-router';

import { privacyPageQuery } from '~/cms/content';
import { queryClient } from '~/cms/queryClient';
import { currentLocale } from '~/i18n/current';
import { PrivacyPage } from '~/pages/privacy/PrivacyPage';

export const Route = createFileRoute('/personvern')({
  loader: () => queryClient.ensureQueryData(privacyPageQuery(currentLocale())),
  component: PrivacyPage,
});
