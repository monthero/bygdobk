import { Card, Stack, Text } from '@mantine/core';
import type { FC, ReactNode } from 'react';

export const StatCard: FC<{ label: ReactNode; value: ReactNode; children?: ReactNode }> = ({
  label,
  value,
  children,
}) => (
  <Card withBorder radius="lg" padding="md">
    <Stack gap={6}>
      <Text size="sm" c="dimmed" fw={600}>
        {label}
      </Text>
      <Text fz={32} fw={800} lh={1.1} className="tabular">
        {value}
      </Text>
      {children}
    </Stack>
  </Card>
);
