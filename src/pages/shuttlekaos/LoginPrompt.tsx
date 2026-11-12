import { Trans } from '@lingui/react/macro';
import { Button, Paper, Text } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { SignIn } from '~/components/ui';
import { useUi } from '~/stores/ui';

import classes from './LoginPrompt.module.css';

const selectOpenLogin = (s: ReturnType<typeof useUi.getState>) => s.openLogin;

export const LoginPrompt: FC<{ children: ReactNode }> = ({ children }) => {
  const openLogin = useUi(selectOpenLogin);
  return (
    <Paper withBorder radius="lg" p="md" className={classes.prompt}>
      <Text>{children}</Text>
      <Button leftSection={<SignIn />} onClick={openLogin} h={44}>
        <Trans>Log in</Trans>
      </Button>
    </Paper>
  );
};
