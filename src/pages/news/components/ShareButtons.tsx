import { Trans } from '@lingui/react/macro';
import { Button, Group } from '@mantine/core';
import { memo } from 'react';

import { CopyLinkButton, ShareNetwork } from '~/components/ui';

const CAN_SHARE = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export const ShareButtons = memo<{ title: string; text: string }>(({ title, text }) => {
  const share = () => void navigator.share({ title, text, url: window.location.href }).catch(() => undefined);

  return (
    <Group gap="xs" aria-live="polite">
      <CopyLinkButton radius="xl" value={window.location.href} />
      {CAN_SHARE && (
        <Button variant="light" radius="xl" leftSection={<ShareNetwork />} onClick={share}>
          <Trans comment="Button that opens the phone or browser share menu for a news post">Share</Trans>
        </Button>
      )}
    </Group>
  );
});
