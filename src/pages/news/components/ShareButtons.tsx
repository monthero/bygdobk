import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Group, type MantineColor } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { memo, type FC } from 'react';
import { z } from 'zod';

import { Check, LinkSimple, ShareNetwork, Warning } from '~/components/ui';

const COPIED_MS = 2000;
const CAN_SHARE = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const CopyState = z.enum(['idle', 'copied', 'failed']);
type CopyState = z.infer<typeof CopyState>;

const COPY_LOOK: Record<CopyState, { label: MessageDescriptor; Icon: FC; color?: MantineColor }> = {
  [CopyState.enum.idle]: { label: msg`Copy link`, Icon: LinkSimple },
  [CopyState.enum.copied]: { label: msg`Link copied`, Icon: Check, color: 'teal' },
  [CopyState.enum.failed]: { label: msg`Could not copy`, Icon: Warning, color: 'red' },
};

const copyState = (copied: boolean, error: Error | null): CopyState => {
  if (copied) return CopyState.enum.copied;
  if (error) return CopyState.enum.failed;
  return CopyState.enum.idle;
};

export const ShareButtons = memo<{ title: string; text: string }>(({ title, text }) => {
  const { i18n } = useLingui();
  const clipboard = useClipboard({ timeout: COPIED_MS });
  const state = copyState(clipboard.copied, clipboard.error);
  const { label, Icon, color } = COPY_LOOK[state];

  const share = () => void navigator.share({ title, text, url: window.location.href }).catch(() => undefined);

  return (
    <Group gap="xs" aria-live="polite">
      <Button
        variant={state === CopyState.enum.idle ? 'default' : 'light'}
        color={color}
        radius="xl"
        leftSection={<Icon />}
        onClick={() => clipboard.copy(window.location.href)}
      >
        {i18n._(label)}
      </Button>
      {CAN_SHARE && (
        <Button variant="light" radius="xl" leftSection={<ShareNetwork />} onClick={share}>
          <Trans comment="Button that opens the phone or browser share menu for a news post">Share</Trans>
        </Button>
      )}
    </Group>
  );
});
