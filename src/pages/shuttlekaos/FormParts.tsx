import { Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useId, type FC, type ReactNode } from 'react';

import { Warning } from '~/components/ui';

import classes from './FormParts.module.css';

export const Section: FC<{ title: ReactNode; aside?: ReactNode; children: ReactNode }> = ({
  title,
  aside,
  children,
}) => {
  const id = useId();
  return (
    <Paper component="section" withBorder radius="lg" p="md" aria-labelledby={id} className={classes.section}>
      <Stack gap="md">
        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Title order={2} size="h4" id={id}>
            {title}
          </Title>
          {aside}
        </Group>
        {children}
      </Stack>
    </Paper>
  );
};

export const Field: FC<{ label: ReactNode; hint?: ReactNode; children: ReactNode }> = ({ label, hint, children }) => (
  <Stack gap={8}>
    <Text fw={600}>{label}</Text>
    {children}
    {hint && (
      <Text size="sm" c="dimmed">
        {hint}
      </Text>
    )}
  </Stack>
);

export const StickyBar: FC<{ reason?: ReactNode; warn?: boolean; children: ReactNode }> = ({
  reason,
  warn,
  children,
}) => (
  <div className={classes.bar}>
    <Container className={classes.barInner}>
      {reason && (
        <Text size="sm" c={warn ? undefined : 'dimmed'} className={classes.reason} data-warn={warn || undefined}>
          {warn && <Warning aria-hidden />} {reason}
        </Text>
      )}
      {children}
    </Container>
  </div>
);
