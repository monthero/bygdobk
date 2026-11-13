import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, Text, TextInput } from '@mantine/core';
import type { ComponentProps, FC, FocusEvent, ReactNode } from 'react';

import { CalendarDots, CalendarPlus, CopyLinkButton, ResponsivePanel } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';

import { calendarFeedUrl } from './feedUrl';

const HTTP = /^https?:/;

const selectAll = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.select();

type Props = Pick<ComponentProps<typeof ResponsivePanel>, 'title' | 'renderTarget'> & {
  url: string;
  note: ReactNode;
};

export const CalendarFeed: FC<Props> = ({ url, note, title, renderTarget }) => {
  const { t } = useLingui();
  return (
    <ResponsivePanel title={title} closeLabel={t`Close`} width={320} renderTarget={renderTarget}>
      {() => (
        <>
          <TextInput readOnly value={url} aria-label={t`Calendar link`} onFocus={selectAll} />
          <CopyLinkButton value={url} fullWidth />
          <Button
            component="a"
            href={url.replace(HTTP, 'webcal:')}
            variant="light"
            leftSection={<CalendarPlus />}
            fullWidth
          >
            <Trans>Open in calendar app</Trans>
          </Button>
          <Text size="sm" c="dimmed">
            {note}
          </Text>
        </>
      )}
    </ResponsivePanel>
  );
};

export const SubscribeButton: FC = () => {
  const { t } = useLingui();
  const isMobile = useIsMobile();
  return (
    <CalendarFeed
      url={calendarFeedUrl()}
      title={<Trans>Subscribe to events</Trans>}
      note={<Trans>New events show up in your calendar by themselves.</Trans>}
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
    />
  );
};
