import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Stack, Text } from '@mantine/core';
import type { FC } from 'react';
import { z } from 'zod';

import { ArrowCounterClockwise, Warning } from '~/components/ui';

const OfflineProblem = z.object({ problem: z.literal('offline') });

const OFFLINE = msg`Can't reach the server. Check your connection.`;
const FAILED = msg`Something went wrong. Try again.`;

const isOffline = (error: unknown) => !navigator.onLine || OfflineProblem.safeParse(error).success;

type Props = { title: string; error: unknown; retrying: boolean; onRetry: () => void };

export const LoadError: FC<Props> = ({ title, error, retrying, onRetry }) => {
  const { i18n } = useLingui();
  return (
    <Alert color="red" variant="light" icon={<Warning />} title={title}>
      <Stack gap="xs" align="flex-start">
        <Text size="sm">{i18n._(isOffline(error) ? OFFLINE : FAILED)}</Text>
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
};
