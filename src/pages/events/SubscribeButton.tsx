import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, Text, TextInput } from '@mantine/core';
import type { FC, FocusEvent } from 'react';

import { CalendarDots, CalendarPlus, CopyLinkButton, ResponsivePanel } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { currentLocale } from '~/i18n/current';

const selectAll = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.select();

export const SubscribeButton: FC = () => {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  const feedUrl = `${window.location.origin}/kalender.ics?lang=${currentLocale()}`;
  const webcalUrl = feedUrl.replace(/^https?:/, 'webcal:');

  return (
    <ResponsivePanel
      title={<Trans>Subscribe to events</Trans>}
      closeLabel={t`Close`}
      width={320}
      renderTarget={(props) => {
        const variant = props['aria-expanded'] ? 'light' : 'default';
        return isMobile ? (
          <ActionIcon variant={variant} size="lg" radius="md" aria-label={t`Subscribe to events`} {...props}>
            <CalendarDots />
          </ActionIcon>
        ) : (
          <Button variant={variant} radius="md" leftSection={<CalendarDots />} {...props}>
            <Trans comment="Button that opens the calendar feed options">Subscribe</Trans>
          </Button>
        );
      }}
    >
      {() => (
        <>
          <TextInput readOnly value={feedUrl} aria-label={t`Calendar link`} onFocus={selectAll} />
          <CopyLinkButton value={feedUrl} fullWidth />
          <Button component="a" href={webcalUrl} variant="light" leftSection={<CalendarPlus />} fullWidth>
            <Trans>Open in calendar app</Trans>
          </Button>
          <Text size="sm" c="dimmed">
            <Trans>New events show up in your calendar by themselves.</Trans>
          </Text>
        </>
      )}
    </ResponsivePanel>
  );
};
