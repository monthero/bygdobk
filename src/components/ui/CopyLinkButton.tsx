import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Button, type ButtonProps, type MantineColor } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { memo, type FC } from 'react';
import { z } from 'zod';

import { Check, LinkSimple, Warning } from './icons';

const COPIED_MS = 2000;

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

type Props = Omit<ButtonProps, 'color' | 'variant' | 'leftSection' | 'children'> & { value: string };

export const CopyLinkButton = memo<Props>(({ value, ...props }) => {
  const { i18n } = useLingui();
  const clipboard = useClipboard({ timeout: COPIED_MS });
  const state = copyState(clipboard.copied, clipboard.error);
  const { label, Icon, color } = COPY_LOOK[state];
  return (
    <Button
      {...props}
      variant={state === CopyState.enum.idle ? 'default' : 'light'}
      color={color}
      leftSection={<Icon />}
      onClick={() => clipboard.copy(value)}
    >
      {i18n._(label)}
    </Button>
  );
});
