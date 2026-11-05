import { Trans } from '@lingui/react/macro';
import { Affix, Button, Group, Paper, Text, ThemeIcon, Transition } from '@mantine/core';
import { memo } from 'react';

import { PencilSimple } from '~/components/ui';
import { useAuth } from '~/stores/auth';

import { useCanEdit } from './hooks';

const POSITION = { bottom: 20, right: 20 };

const turnOff = () => useAuth.getState().setEditMode(false);

export const EditModeAffix = memo(() => {
  const canEdit = useCanEdit();

  return (
    <Affix position={POSITION}>
      <Transition mounted={canEdit} transition="slide-up">
        {(styles) => (
          <Paper component="output" style={styles} withBorder shadow="md" radius="xl" py={6} pl={6} pr={8}>
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon radius="xl" color="grape" variant="light">
                <PencilSimple />
              </ThemeIcon>
              <Text size="sm" fw={600}>
                <Trans>Edit mode is on</Trans>
              </Text>
              <Button size="xs" radius="xl" variant="default" onClick={turnOff}>
                <Trans>Turn off</Trans>
              </Button>
            </Group>
          </Paper>
        )}
      </Transition>
    </Affix>
  );
});
