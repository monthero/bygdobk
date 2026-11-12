import { Trans } from '@lingui/react/macro';
import { Button, CopyButton, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import type { FC } from 'react';

import { Check, LinkSimple, ShareNetwork, UserPlus } from '~/components/ui';

import { sessionUrl } from './labels';
import { useShareSession } from './useShareSession';

import classes from './InviteCard.module.css';

export const InviteCard: FC<{ code: string; title: string }> = ({ code, title }) => {
  const share = useShareSession();
  const url = sessionUrl(code);
  return (
    <Paper radius="lg" p="md" className={classes.card}>
      <Stack gap="sm">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" color="brand" radius="xl" size={36}>
            <UserPlus />
          </ThemeIcon>
          <Title order={2} size="h4">
            <Trans>Invite players</Trans>
          </Title>
        </Group>
        <Text size="sm">
          <Trans>Send the link. People join from their own phone and show up below.</Trans>
        </Text>
        <Text className={classes.url}>{url}</Text>
        <Group gap="sm" grow>
          <Button size="md" leftSection={<ShareNetwork />} onClick={() => share(code, title)}>
            <Trans>Share link</Trans>
          </Button>
          <CopyButton value={url}>
            {({ copied, copy }) => (
              <Button
                size="md"
                variant={copied ? 'light' : 'default'}
                color={copied ? 'teal' : undefined}
                leftSection={copied ? <Check /> : <LinkSimple />}
                onClick={copy}
              >
                {copied ? <Trans>Copied</Trans> : <Trans>Copy</Trans>}
              </Button>
            )}
          </CopyButton>
        </Group>
      </Stack>
    </Paper>
  );
};
