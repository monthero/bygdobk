import { VisuallyHidden } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';

import classes from './Segmented.module.css';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
  color?: string;
}

interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  height?: number;
}

export const Segmented = <T extends string>({ options, value, onChange, label, height = 36 }: SegmentedProps<T>) => {
  const hit = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const tone = options[hit]?.color;
  const style = {
    '--n': options.length,
    '--i': hit,
    '--h': `${height}px`,
    '--tone': tone ? `var(--mantine-color-${tone}-filled)` : undefined,
  } as CSSProperties;

  return (
    <fieldset className={classes.root} data-bk="segmented" style={style}>
      <span className={classes.pill} />
      <VisuallyHidden component="legend">{label}</VisuallyHidden>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={classes.option}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.color && (
            <span className={classes.dot} style={{ background: `var(--mantine-color-${o.color}-5)` }} aria-hidden />
          )}
          {o.label}
        </button>
      ))}
    </fieldset>
  );
};
