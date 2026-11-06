import { Trans } from '@lingui/react/macro';
import { Button, Center, Container, Loader, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect, useState, type FC } from 'react';

import { ArrowCounterClockwise, Shuttle } from '~/components/ui';

export const PageLoader: FC = () => (
  <Center mih="60dvh">
    <Loader />
  </Center>
);

export const ContentError: FC = () => {
  const router = useRouter();
  const { reset } = useQueryErrorResetBoundary();
  const [retrying, setRetrying] = useState(false);

  useEffect(reset, [reset]);

  const retry = () => {
    setRetrying(true);
    void router.invalidate().finally(() => setRetrying(false));
  };

  return (
    <Container size="sm" py={64}>
      <Stack align="center" ta="center" gap="md">
        <ThemeIcon size={64} radius="xl" variant="light">
          <Shuttle width={32} height={32} />
        </ThemeIcon>
        <Title order={1}>
          <Trans>The shuttle got stuck in the net</Trans>
        </Title>
        <Text size="lg" c="dimmed" maw={460}>
          <Trans>We could not load the page. Check your connection and try again.</Trans>
        </Text>
        <Button size="md" leftSection={<ArrowCounterClockwise />} loading={retrying} onClick={retry}>
          <Trans>Try again</Trans>
        </Button>
      </Stack>
    </Container>
  );
};
