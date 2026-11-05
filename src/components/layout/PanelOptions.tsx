import { UnstyledButton } from '@mantine/core';
import type { ReactNode } from 'react';

import { Check, type PanelVariant } from '~/components/ui';

import classes from './PanelOptions.module.css';

export type PanelOption<T extends string> = { value: T; icon: ReactNode; label: string; lang?: string };

type Props<T extends string> = {
  options: readonly PanelOption<T>[];
  current: T;
  variant: PanelVariant;
  onPick: (value: T) => void;
};

export const PanelOptions = <T extends string>({ options, current, variant, onPick }: Props<T>) => (
  <div className={classes.list}>
    {options.map((option) => (
      <UnstyledButton
        key={option.value}
        className={classes.option}
        data-size={variant}
        aria-current={option.value === current}
        lang={option.lang}
        onClick={() => onPick(option.value)}
      >
        {option.icon}
        <span className={classes.name}>{option.label}</span>
        {option.value === current && <Check className={classes.check} aria-hidden />}
      </UnstyledButton>
    ))}
  </div>
);
