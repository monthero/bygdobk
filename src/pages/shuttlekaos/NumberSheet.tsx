import { Trans } from '@lingui/react/macro';
import { Button, Stack, UnstyledButton } from '@mantine/core';
import { useMemo, type FC, type ReactNode } from 'react';

import { ResponsiveModal } from '~/components/ui';

import classes from './NumberSheet.module.css';

type Props = {
  opened: boolean;
  title: ReactNode;
  value: number | null;
  min: number;
  max: number;
  nullable?: boolean;
  onPick: (value: number | null) => void;
  onClose: () => void;
};

export const NumberSheet: FC<Props> = ({ opened, title, value, min, max, nullable, onPick, onClose }) => {
  const numbers = useMemo(() => Array.from({ length: max - min + 1 }, (_, index) => min + index), [min, max]);
  const pick = (next: number | null) => {
    onPick(next);
    onClose();
  };
  return (
    <ResponsiveModal opened={opened} onClose={onClose} title={title}>
      <Stack gap="md">
        <div className={classes.grid}>
          {numbers.map((number) => (
            <UnstyledButton
              key={number}
              className={classes.cell}
              data-selected={number === value || undefined}
              aria-pressed={number === value}
              data-autofocus={number === value || undefined}
              onClick={() => pick(number)}
            >
              {number}
            </UnstyledButton>
          ))}
        </div>
        {nullable && value !== null && (
          <Button variant="subtle" color="gray" h={44} onClick={() => pick(null)}>
            <Trans>Clear</Trans>
          </Button>
        )}
      </Stack>
    </ResponsiveModal>
  );
};
