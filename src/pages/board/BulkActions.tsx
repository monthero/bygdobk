import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Button, Group, Stack, Text, type MantineColor } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import type { FC } from 'react';

import { Check, Coins, copyState, CopyState, EnvelopeSimple, Warning, X } from '~/components/ui';
import { kr } from '~/pages/join/offers';

import classes from './selection.module.css';

const COPIED_MS = 2500;

const COPY_LOOK: Record<CopyState, { Icon: FC; color?: MantineColor; label?: MessageDescriptor }> = {
  [CopyState.enum.idle]: { Icon: EnvelopeSimple },
  [CopyState.enum.copied]: { Icon: Check, color: 'teal', label: msg`Copied! Paste them into Bcc` },
  [CopyState.enum.failed]: { Icon: Warning, color: 'red', label: msg`Could not copy` },
};

type CopyProps = { emails: readonly string[]; noAccount: number };

export const CopyEmailsButton: FC<CopyProps> = ({ emails, noAccount }) => {
  const { i18n } = useLingui();
  const clipboard = useClipboard({ timeout: COPIED_MS });
  const state = copyState(clipboard.copied, clipboard.error);
  const { Icon, color, label } = COPY_LOOK[state];
  const count = emails.length;
  return (
    <Stack gap={4} align="flex-end">
      <Button
        radius="xl"
        variant={state === CopyState.enum.idle ? 'default' : 'light'}
        color={color}
        leftSection={<Icon />}
        disabled={count === 0}
        onClick={() => clipboard.copy(emails.join(', '))}
        aria-live="polite"
      >
        {label ? i18n._(label) : <Plural value={count} one="Copy # email" other="Copy # emails" />}
      </Button>
      {noAccount > 0 && (
        <Text size="xs" c="dimmed" ta="end">
          <Plural
            value={noAccount}
            one="# person without an account is not included."
            other="# people without an account are not included."
          />
        </Text>
      )}
    </Stack>
  );
};

type BarProps = { count: number; totalNok: number; onClear: () => void; onMarkPaid: () => void };

export const SelectionBar: FC<BarProps> = ({ count, totalNok, onClear, onMarkPaid }) => {
  const { t } = useLingui();
  const total = kr(totalNok);
  return (
    <Group
      className={classes.bar}
      justify="space-between"
      wrap="nowrap"
      gap="xs"
      component="section"
      aria-label={t`Selected memberships`}
    >
      <Text size="sm" fw={600} className="tabular">
        <Trans comment="How many memberships are picked, and what they cost together">
          {count} selected · {total}
        </Trans>
      </Text>
      <Group gap={4} wrap="nowrap">
        <Button variant="subtle" color="gray" radius="xl" size="sm" leftSection={<X />} onClick={onClear}>
          <Trans comment="Button: unselect all picked memberships">Clear</Trans>
        </Button>
        <Button radius="xl" size="sm" leftSection={<Coins />} onClick={onMarkPaid}>
          <Trans>Mark {count} as paid</Trans>
        </Button>
      </Group>
    </Group>
  );
};
