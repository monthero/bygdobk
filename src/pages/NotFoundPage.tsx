import { Center, Container, Loader } from '@mantine/core';
import { lazy, Suspense, type FC } from 'react';

const KeepItUp = lazy(() => import('~/pages/study/notfound/concepts/KeepItUp'));

const FALLBACK = (
  <Center mih={480}>
    <Loader />
  </Center>
);

export const NotFoundPage: FC = () => (
  <Center data-fill flex={1} py={64}>
    <Container size="md" w="100%">
      <Suspense fallback={FALLBACK}>
        <KeepItUp />
      </Suspense>
    </Container>
  </Center>
);
