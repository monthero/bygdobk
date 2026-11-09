import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Button, Text, TextInput } from '@mantine/core';
import type { ComponentProps, FC, FocusEvent, ReactNode } from 'react';

import { CalendarDots, CalendarPlus, CopyLinkButton, ResponsivePanel } from '~/components/ui';
import { GROUP_SLUGS, type Group } from '~/data/club';
import { useIsMobile } from '~/hooks/useIsMobile';
import { currentLocale } from '~/i18n/current';

const HTTP = /^https?:/;

const selectAll = (e: FocusEvent<HTMLInputElement>) => e.currentTarget.select();

export const calendarFeedUrl = (group?: Group) => {
  const url = new URL('/kalender.ics', window.location.origin);
  if (group) url.searchParams.set('gruppe', GROUP_SLUGS.toSlug(group));
  url.searchParams.set('lang', currentLocale());
  return url.href;
};

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
