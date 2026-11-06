import { Alert, Container, type MantineColor } from '@mantine/core';
import { memo, type ReactNode } from 'react';

import { useSiteContent } from '~/cms/content';
import { Info, Warning } from '~/components/ui';
import { NoticeTone } from '~/data/notice';

const TONES: Record<NoticeTone, { color: MantineColor; icon: ReactNode }> = {
  [NoticeTone.enum.info]: { color: 'brand', icon: <Info /> },
  [NoticeTone.enum.warning]: { color: 'yellow', icon: <Warning /> },
};

const TEXT_STYLE = { whiteSpace: 'pre-line' } as const;

export const SiteNotice = memo(() => {
  const { notice } = useSiteContent();
  if (!notice.visible || !notice.text?.trim()) return null;
  const { color, icon } = TONES[notice.tone];

  return (
    <Container pt="md">
      <Alert color={color} icon={icon} variant="light" style={TEXT_STYLE}>
        {notice.text}
      </Alert>
    </Container>
  );
});
