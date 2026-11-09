import { Trans } from '@lingui/react/macro';
import { Anchor, Button, List, Popover, Text } from '@mantine/core';
import { memo } from 'react';
import { z } from 'zod';
import ShareIcon from '~icons/ph/export';

import { DownloadSimple } from '~/components/ui';
import { InstallMode, useInstallApp } from '~/hooks/useInstallApp';

import classes from './InstallApp.module.css';

export const InstallLook = z.enum(['link', 'button']);
export type InstallLook = z.infer<typeof InstallLook>;

const LABEL = <Trans comment="Button that installs the website as an app on the phone or computer">Install app</Trans>;

type Props = { look: InstallLook };

export const InstallApp = memo<Props>(({ look }) => {
  const { mode, install } = useInstallApp();
  if (!mode) return null;

  const onClick = mode === InstallMode.enum.prompt ? install : undefined;
  const trigger =
    look === InstallLook.enum.link ? (
      <Anchor component="button" type="button" size="sm" c="inherit" className={classes.link} onClick={onClick}>
        <DownloadSimple aria-hidden />
        {LABEL}
      </Anchor>
    ) : (
      <Button size="md" variant="subtle" leftSection={<DownloadSimple />} onClick={onClick}>
        {LABEL}
      </Button>
    );

  if (mode === InstallMode.enum.prompt) return trigger;

  return (
    <Popover width={280} position="top" withArrow shadow="md">
      <Popover.Target>{trigger}</Popover.Target>
      <Popover.Dropdown>
        <Text fw={700} mb="xs">
          <Trans>Add Bygdø BK to your Home Screen</Trans>
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
