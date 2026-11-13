import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, List, Popover, Text } from '@mantine/core';
import { memo } from 'react';
import ShareIcon from '~icons/ph/export';

import { DownloadSimple } from '~/components/ui';
import { InstallMode, useInstallApp } from '~/hooks/useInstallApp';
import { AppKind } from '~/utils/apps';

import { InstallLook } from './installLook';

import classes from './InstallApp.module.css';

const LABELS: Record<AppKind, MessageDescriptor> = {
  [AppKind.enum.club]: msg({
    message: 'Install app',
    comment: 'Button that installs the website as an app on the phone or computer',
  }),
  [AppKind.enum.shuttlekaos]: msg({
    message: 'Install ShuttleKaos',
    comment: 'Button on ShuttleKaos pages that installs ShuttleKaos as its own app on the phone or computer',
  }),
};

const TITLES: Record<AppKind, MessageDescriptor> = {
  [AppKind.enum.club]: msg`Add Bygdø BK to your Home Screen`,
  [AppKind.enum.shuttlekaos]: msg({
    message: 'Add ShuttleKaos to your Home Screen',
    comment: 'iPhone and iPad: title above the steps to add the ShuttleKaos app to the Home Screen',
  }),
};

type Props = { look: InstallLook };

export const InstallApp = memo<Props>(({ look }) => {
  const { i18n } = useLingui();
  const { mode, app, install } = useInstallApp();
  if (!mode) return null;

  const label = i18n._(LABELS[app]);

  const onClick = mode === InstallMode.enum.prompt ? install : undefined;
  const trigger =
    look === InstallLook.enum.link ? (
      <Anchor component="button" type="button" size="sm" c="inherit" className={classes.link} onClick={onClick}>
        <DownloadSimple aria-hidden />
        {label}
      </Anchor>
    ) : (
      <Button size="md" variant="subtle" leftSection={<DownloadSimple />} onClick={onClick}>
        {label}
      </Button>
    );

  if (mode === InstallMode.enum.prompt) return trigger;

  return (
    <Popover width={280} position="top" withArrow shadow="md">
      <Popover.Target>{trigger}</Popover.Target>
      <Popover.Dropdown>
        <Text fw={700} mb="xs">
          {i18n._(TITLES[app])}
        </Text>
        <List type="ordered" size="sm" spacing={6}>
          <List.Item>
            <Trans comment="iPhone and iPad: first step to add the site to the Home Screen. The icon is the iOS Share icon">
              Tap Share <ShareIcon aria-hidden className={classes.share} /> in the browser.
            </Trans>
          </List.Item>
          <List.Item>
            <Trans comment="iPhone and iPad: second step. Use the exact name of this option in iOS in your language">
              Pick “Add to Home Screen”.
            </Trans>
          </List.Item>
        </List>
      </Popover.Dropdown>
    </Popover>
  );
});
