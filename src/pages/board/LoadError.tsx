import { Trans } from '@lingui/react/macro';
import { Alert, Button, Stack, Text } from '@mantine/core';
import type { FC } from 'react';

import { ArrowCounterClockwise, Warning } from '~/components/ui';

type Props = { title: string; retrying: boolean; onRetry: () => void };

export const LoadError: FC<Props> = ({ title, retrying, onRetry }) => (
  <Alert color="red" variant="light" icon={<Warning />} title={title}>
    <Stack gap="xs" align="flex-start">
      <Text size="sm">
        <Trans>Check your connection and try again.</Trans>
      </Text>
      <Button
        size="xs"
        variant="light"
        color="red"
        leftSection={<ArrowCounterClockwise />}
        loading={retrying}
        onClick={onRetry}
      >
        <Trans>Try again</Trans>
      </Button>
    </Stack>
  </Alert>
);
