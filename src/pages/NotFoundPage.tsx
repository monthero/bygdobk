import { useLingui } from '@lingui/react/macro';
import { Center, Container, Loader } from '@mantine/core';
import { lazy, Suspense, type FC } from 'react';

import { usePageTitle } from '~/hooks/usePageTitle';

const KeepItUp = lazy(() => import('~/pages/study/notfound/ideas/KeepItUp'));

const FALLBACK = (
  <Center mih={480}>
    <Loader />
  </Center>
);

export const NotFoundPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`Page not found`);
  return (
    <Center data-fill flex={1} py={64}>
      <Container size="md" w="100%">
        <Suspense fallback={FALLBACK}>
          <KeepItUp />
        </Suspense>
      </Container>
    </Center>
  );
};
