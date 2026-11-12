import { Trans } from '@lingui/react/macro';
import { Button, NativeSelect, Popover, Stack, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useMemo, useState, type FC } from 'react';

import { Stepper } from './Stepper';

import classes from './ScoreBox.module.css';

const TOUCH_QUERY = '(pointer: coarse)';
const EMPTY = '';
const SELECT_CLASS_NAMES = { root: classes.selectRoot, input: classes.select };

type Props = {
  label: string;
  value: number | null;
  max: number;
  won?: boolean;
  onPick?: (value: number | null) => void;
};

const DesktopBox: FC<Required<Pick<Props, 'onPick'>> & Omit<Props, 'onPick'>> = ({
  label,
  value,
  max,
  won,
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

export const ScoreBox: FC<Props> = ({ label, value, max, won, onPick }) => {
  const touch = useMediaQuery(TOUCH_QUERY);
  const options = useMemo(
    () => [{ value: EMPTY, label: '–' }, ...Array.from({ length: max + 1 }, (_, index) => String(index))],
    [max],
  );

  if (!onPick) {
    return (
      <span className={classes.box} data-won={won || undefined} data-empty={value === null || undefined}>
        {value ?? '–'}
      </span>
    );
  }
  if (!touch) return <DesktopBox label={label} value={value} max={max} won={won} onPick={onPick} />;
  return (
    <NativeSelect
      aria-label={label}
      data={options}
      value={value === null ? EMPTY : String(value)}
      onChange={(e) => onPick(e.currentTarget.value === EMPTY ? null : Number(e.currentTarget.value))}
      rightSection={null}
      rightSectionWidth={0}
      classNames={SELECT_CLASS_NAMES}
      data-won={won || undefined}
      data-empty={value === null || undefined}
    />
  );
};
