import { useLingui } from '@lingui/react/macro';
import { ActionIcon, NativeSelect, NumberInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMemo, useState, type ChangeEvent, type FC } from 'react';

import { Minus, Plus } from '~/components/ui';

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
};

export const Stepper: FC<Props> = ({ label, value, min, max, onChange, nullable, large }) => {
  const { t } = useLingui();
  const isTouch = useMediaQuery(TOUCH_QUERY);
  const [shown, setShown] = useState(value);
  const [draft, setDraft] = useState<number | string>(value ?? EMPTY);
  if (shown !== value) {
    setShown(value);
    setDraft(value ?? EMPTY);
  }

  const options = useMemo(
    () => [
      ...(nullable ? [{ value: EMPTY, label: '–' }] : []),
      ...Array.from({ length: max - min + 1 }, (_, index) => String(min + index)),
    ],
    [min, max, nullable],
  );

  const change = (next: number | string) => {
    setDraft(next);
    if (typeof next === 'number') onChange(next);
    else if (nullable) onChange(null);
  };

  const pick = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value;
    onChange(next === EMPTY ? null : Number(next));
  };

  const step = (by: number) => onChange(Math.min(max, Math.max(min, (value ?? min - by) + by)));

  return (
    <div className={classes.stepper} data-large={large || undefined}>
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
        <NativeSelect
          aria-label={label}
          data={options}
          value={value === null ? EMPTY : String(value)}
          onChange={pick}
          rightSection={null}
          rightSectionWidth={0}
          classNames={INPUT_CLASS_NAMES}
        />
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
