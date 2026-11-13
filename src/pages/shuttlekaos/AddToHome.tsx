import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Group, Text, Transition } from '@mantine/core';
import { useMediaQuery, useTimeout } from '@mantine/hooks';
import { useId, useState, type FC } from 'react';

import { INSTALL_TITLES } from '~/components/layout/install';
import { InstallSteps } from '~/components/layout/InstallApp';
import { DownloadSimple } from '~/components/ui';
import { InstallMode, useInstallApp } from '~/hooks/useInstallApp';
import { safeLocalStorage } from '~/stores/persistence';
import { AppKind } from '~/utils/apps';

import classes from './AddToHome.module.css';

const DISMISSED_KEY = 'shuttlekaos-add-to-home-dismissed';
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2500;
const PHONE_QUERY = '(pointer: coarse) and (max-width: 48em)';

const dismissedRecently = () => Date.now() - Number(safeLocalStorage.getItem(DISMISSED_KEY)) < SNOOZE_MS;

export const AddToHomeBanner: FC = () => {
  const { i18n } = useLingui();
  const titleId = useId();
  const { mode, app, install } = useInstallApp();
  const phone = useMediaQuery(PHONE_QUERY);
  const [dismissed, setDismissed] = useState(dismissedRecently);
  const [ready, setReady] = useState(false);
  useTimeout(() => setReady(true), SHOW_DELAY_MS, { autoInvoke: true });

  const dismiss = () => {
    safeLocalStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDismissed(true);
  };

  const shown = ready && phone && !dismissed && mode !== undefined && app === AppKind.enum.shuttlekaos;

  return (
    <Transition mounted={shown} transition="slide-up" duration={250}>
      {(styles) => (
        <section aria-labelledby={titleId} className={classes.banner} style={styles}>
          <img src="/shuttlekaos-192.png" alt="" width={44} height={44} className={classes.icon} />
          <div className={classes.body}>
            <Text id={titleId} fw={800} className={classes.title}>
              {i18n._(INSTALL_TITLES[AppKind.enum.shuttlekaos])}
            </Text>
            {mode === InstallMode.enum.prompt ? (
              <Text size="sm" c="dimmed">
                <Trans comment="Phone banner on ShuttleKaos: why to add the app to the Home screen">
                  Opens full screen, straight to your sessions.
                </Trans>
              </Text>
            ) : (
              mode && <InstallSteps mode={mode} />
            )}
            <Group gap="xs" mt={4}>
              {mode === InstallMode.enum.prompt && (
                <Button size="compact-md" leftSection={<DownloadSimple />} onClick={install}>
                  <Trans comment="Phone banner button that adds the ShuttleKaos app to the Android Home screen">
                    Add to Home screen
                  </Trans>
                </Button>
              )}
              <Button size="compact-md" variant="default" onClick={dismiss}>
                <Trans comment="Hides the banner that suggests adding ShuttleKaos to the Home screen">Not now</Trans>
              </Button>
            </Group>
          </div>
        </section>
      )}
    </Transition>
  );
};
