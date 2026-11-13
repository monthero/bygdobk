import { Container, Group, Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useId, type FC, type ReactNode } from 'react';

import { Warning } from '~/components/ui';

import { SectionColor } from './labels';

import classes from './FormParts.module.css';

type SectionProps = {
  title: ReactNode;
  icon?: ReactNode;
  color?: SectionColor;
  aside?: ReactNode;
  children: ReactNode;
};

export const Section: FC<SectionProps> = ({ title, icon, color = SectionColor.enum.brand, aside, children }) => {
  const id = useId();
  return (
    <Paper
      component="section"
      withBorder
      radius="lg"
      p="md"
      aria-labelledby={id}
      className={classes.section}
      data-color={color}
    >
      <Stack gap="md">
        <Group justify="space-between" gap="xs" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            {icon && (
              <ThemeIcon variant="light" color={color} radius="xl" size={36} className={classes.icon}>
                {icon}
              </ThemeIcon>
            )}
            <Title order={2} size="h4" id={id}>
              {title}
            </Title>
          </Group>
          {aside}
        </Group>
        {children}
      </Stack>
    </Paper>
  );
};

export const Field: FC<{ label?: ReactNode; hint?: ReactNode; children: ReactNode }> = ({ label, hint, children }) => (
  <Stack gap={8}>
    {label && <Text fw={600}>{label}</Text>}
    {children}
    {hint && (
      <Text size="sm" c="dimmed">
        {hint}
      </Text>
    )}
  </Stack>
);

const BOTTOM_BAR_VAR = '--sk-bottom-bar';

const trackBarHeight = (node: HTMLDivElement | null) => {
  if (!node) return undefined;
  const root = document.documentElement;
  const observer = new ResizeObserver(() => root.style.setProperty(BOTTOM_BAR_VAR, `${node.offsetHeight}px`));
  observer.observe(node);
  return () => {
    observer.disconnect();
    root.style.removeProperty(BOTTOM_BAR_VAR);
  };
};

export const StickyBar: FC<{ reason?: ReactNode; warn?: boolean; children: ReactNode }> = ({
  reason,
  warn,
  children,
}) => (
  <>
    <div className={classes.spacer} data-reason={reason ? true : undefined} aria-hidden />
    <div ref={trackBarHeight} className={classes.bar} data-bottom-bar>
      <Container className={classes.barInner}>
        {reason && (
          <Text size="sm" c={warn ? undefined : 'dimmed'} className={classes.reason} data-warn={warn || undefined}>
            {warn && <Warning aria-hidden />} {reason}
          </Text>
        )}
        {children}
      </Container>
    </div>
  </>
);
