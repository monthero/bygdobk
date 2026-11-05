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

interface SegmentedMultiProps<T extends string | number> {
  options: readonly SegmentedOption<T>[];
  value: readonly T[];
  onChange: (value: T[]) => void;
  label: string;
  allLabel: ReactNode;
  height?: number;
}

export const SegmentedMulti = <T extends string | number>({
  options,
  value,
  onChange,
  label,
  allLabel,
  height = 36,
}: SegmentedMultiProps<T>) => {
  const picked = new Set(value);
  const toggle = (option: T) =>
    onChange(
      options.filter((o) => (o.value === option ? !picked.has(o.value) : picked.has(o.value))).map((o) => o.value),
    );

  return (
    <fieldset
      className={classes.root}
      data-bk="segmented"
      data-multiple
      style={{ '--n': options.length + 1, '--h': `${height}px` } as CSSProperties}
    >
      <VisuallyHidden component="legend">{label}</VisuallyHidden>
      <button type="button" className={classes.option} aria-pressed={picked.size === 0} onClick={() => onChange([])}>
        {allLabel}
      </button>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={classes.option}
          aria-pressed={picked.has(o.value)}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </fieldset>
  );
};
