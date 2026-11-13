import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, List, Popover, Text } from '@mantine/core';
import { memo, type FC } from 'react';
import ShareIcon from '~icons/ph/export';

import { DotsThreeVertical, DownloadSimple } from '~/components/ui';
import { InstallMode, useInstallApp } from '~/hooks/useInstallApp';
import { AppKind } from '~/utils/apps';

import { INSTALL_TITLES, InstallLook } from './install';

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

export const InstallSteps: FC<{ mode: InstallMode }> = ({ mode }) => {
  if (mode === InstallMode.enum.prompt) return null;
  if (mode === InstallMode.enum.firefox) {
    return (
      <List type="ordered" size="sm" spacing={6}>
        <List.Item>
          <Trans comment="Firefox on Android: first step to add the site to the Home screen. The icon is the three-dot Firefox menu icon">
            Tap the menu <DotsThreeVertical aria-hidden className={classes.stepIcon} /> in the browser.
          </Trans>
        </List.Item>
        <List.Item>
          <Trans comment="Firefox on Android: second step. Use the exact name of this menu option in Firefox in your language">
            Pick “Add app to Home screen”.
          </Trans>
        </List.Item>
      </List>
    );
  }
  return (
    <List type="ordered" size="sm" spacing={6}>
      <List.Item>
        <Trans comment="iPhone and iPad: first step to add the site to the Home Screen. The icon is the iOS Share icon">
          Tap Share <ShareIcon aria-hidden className={classes.stepIcon} /> in the browser.
        </Trans>
      </List.Item>
      <List.Item>
        <Trans comment="iPhone and iPad: second step. Use the exact name of this option in iOS in your language">
          Pick “Add to Home Screen”.
        </Trans>
      </List.Item>
    </List>
  );
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
          {i18n._(INSTALL_TITLES[app])}
        </Text>
        <InstallSteps mode={mode} />
      </Popover.Dropdown>
    </Popover>
  );
});
