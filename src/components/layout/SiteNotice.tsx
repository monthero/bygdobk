import { Alert, Container, type MantineColor } from '@mantine/core';
import { memo, type FC, type ReactNode } from 'react';

import { Info, Warning } from '~/components/ui';
import { NoticeTone, useContent, type Notice } from '~/stores/content';

const TONES: Record<NoticeTone, { color: MantineColor; icon: ReactNode }> = {
  [NoticeTone.enum.info]: { color: 'brand', icon: <Info /> },
  [NoticeTone.enum.warning]: { color: 'yellow', icon: <Warning /> },
};

const TEXT_STYLE = { whiteSpace: 'pre-line' } as const;

export const NoticeAlert: FC<{ notice: Notice }> = ({ notice }) => (
  <Alert color={TONES[notice.tone].color} icon={TONES[notice.tone].icon} variant="light" style={TEXT_STYLE}>
    {notice.text}
  </Alert>
);

export const SiteNotice = memo(() => {
  const notice = useContent((s) => s.notice);
  if (!notice.visible || !notice.text.trim()) return null;

  return (
    <Container pt="md">
      <NoticeAlert notice={notice} />
    </Container>
  );
});
