import { Trans } from '@lingui/react/macro';
import { Button, Popover, Stack, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useState, type FC } from 'react';

import { NumberSheet } from './NumberSheet';
import { Stepper } from './Stepper';

import classes from './ScoreBox.module.css';

const TOUCH_QUERY = '(pointer: coarse)';

type Props = {
  label: string;
  value: number | null;
  max: number;
  won?: boolean;
  lost?: boolean;
  onPick?: (value: number | null) => void;
};

const DesktopBox: FC<Required<Pick<Props, 'onPick'>> & Omit<Props, 'onPick'>> = ({
  label,
  value,
  max,
  won,
  lost,
  onPick,
}) => {
  const [opened, { close, toggle }] = useDisclosure(false);
  const [draft, setDraft] = useState(value);
  const open = () => {
    setDraft(value);
    toggle();
  };
  const apply = () => {
    onPick(draft);
    close();
  };
  return (
    <Popover opened={opened} onChange={(next) => !next && close()} position="bottom" withArrow shadow="md" trapFocus>
      <Popover.Target>
        <UnstyledButton
          className={classes.box}
          data-won={won || undefined}
          data-lost={lost || undefined}
          data-empty={value === null || undefined}
          aria-label={label}
          onClick={open}
        >
          {value ?? '–'}
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm" align="center">
          <Stepper label={label} value={draft} min={0} max={max} nullable onChange={setDraft} />
          <Button fullWidth onClick={apply}>
            <Trans>OK</Trans>
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};

const TouchBox: FC<Required<Pick<Props, 'onPick'>> & Omit<Props, 'onPick'>> = ({
  label,
  value,
  max,
  won,
  lost,
  onPick,
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <UnstyledButton
        className={classes.box}
        data-won={won || undefined}
        data-lost={lost || undefined}
        data-empty={value === null || undefined}
        aria-label={label}
        onClick={open}
      >
        {value ?? '–'}
      </UnstyledButton>
      <NumberSheet
        opened={opened}
        title={label}
        value={value}
        min={0}
        max={max}
        nullable
        onPick={onPick}
        onClose={close}
      />
    </>
  );
};

export const ScoreBox: FC<Props> = ({ label, value, max, won, lost, onPick }) => {
  const touch = useMediaQuery(TOUCH_QUERY);

  if (!onPick) {
    return (
      <span
        className={classes.box}
        data-won={won || undefined}
        data-lost={lost || undefined}
        data-empty={value === null || undefined}
      >
        {value ?? '–'}
      </span>
    );
  }
  if (touch) return <TouchBox label={label} value={value} max={max} won={won} lost={lost} onPick={onPick} />;
  return <DesktopBox label={label} value={value} max={max} won={won} lost={lost} onPick={onPick} />;
};
