import { useLingui } from '@lingui/react/macro';
import { ActionIcon, NumberInput, UnstyledButton } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useState, type FC } from 'react';

import { Minus, Plus } from '~/components/ui';

import { NumberSheet } from './NumberSheet';

import classes from './Stepper.module.css';

const INPUT_CLASS_NAMES = { root: classes.field, input: classes.input };
const TOUCH_QUERY = '(pointer: coarse)';
const EMPTY = '';

type Props = {
  label: string;
  value: number | null;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
  nullable?: boolean;
  large?: boolean;
  fullWidth?: boolean;
};

export const Stepper: FC<Props> = ({ label, value, min, max, onChange, nullable, large, fullWidth }) => {
  const { t } = useLingui();
  const isTouch = useMediaQuery(TOUCH_QUERY);
  const [sheet, sheetControls] = useDisclosure(false);
  const [shown, setShown] = useState(value);
  const [draft, setDraft] = useState<number | string>(value ?? EMPTY);
  if (shown !== value) {
    setShown(value);
    setDraft(value ?? EMPTY);
  }

  const change = (next: number | string) => {
    setDraft(next);
    if (typeof next === 'number') onChange(next);
    else if (nullable) onChange(null);
  };

  const step = (by: number) => onChange(Math.min(max, Math.max(min, (value ?? min - by) + by)));

  return (
    <div className={classes.stepper} data-large={large || undefined} data-full={fullWidth || undefined}>
      <ActionIcon
        variant="default"
        radius="xl"
        className={classes.button}
        aria-label={t`One less: ${label}`}
        disabled={value !== null && value <= min}
        onClick={() => step(-1)}
      >
        <Minus />
      </ActionIcon>
      {isTouch ? (
        <>
          <UnstyledButton className={classes.tap} aria-label={label} onClick={sheetControls.open}>
            {value ?? '–'}
          </UnstyledButton>
          <NumberSheet
            opened={sheet}
            title={label}
            value={value}
            min={min}
            max={max}
            nullable={nullable}
            onPick={(next) => {
              if (next !== null || nullable) onChange(next);
            }}
            onClose={sheetControls.close}
          />
        </>
      ) : (
        <NumberInput
          aria-label={label}
          value={draft}
          onChange={change}
          onBlur={() => !nullable && draft === EMPTY && setDraft(value ?? EMPTY)}
          min={min}
          max={max}
          clampBehavior="strict"
          allowDecimal={false}
          allowNegative={false}
          hideControls
          inputMode="numeric"
          classNames={INPUT_CLASS_NAMES}
        />
      )}
      <ActionIcon
        variant="default"
        radius="xl"
        className={classes.button}
        aria-label={t`One more: ${label}`}
        disabled={value !== null && value >= max}
        onClick={() => step(1)}
      >
        <Plus />
      </ActionIcon>
    </div>
  );
};
