import { BarsList, type BarsListBarData } from '@mantine/charts';
import type { CSSProperties, FC } from 'react';

import { numberFormat } from '~/i18n/current';
import { percent } from '~/utils/numbers';

import classes from './VisitorsPage.module.css';

const BAR_HEIGHT = 32;
const BARS_CLASSES = { bar: classes.ranking__row, barLabel: classes.ranking__bar, labelsRow: classes.ranking__head };

const SHARE = { style: 'percent', maximumFractionDigits: 0 } as const;

type Props = { data: BarsListBarData[]; label: string; valueLabel: string; total?: number };

export const Ranking: FC<Props> = ({ data, label, valueLabel, total }) => {
  const max = Math.max(0, ...data.map((d) => d.value));
  const format = (value: number) => {
    const count = numberFormat().format(value);
    return total ? `${count} · ${numberFormat(SHARE).format(percent(value, total) * 0.01)}` : count;
  };
  const barProps = ({ name, value }: BarsListBarData) => ({
    title: name,
    style: {
      width: '100%',
      backgroundColor: 'transparent',
      color: 'var(--mantine-color-text)',
      '--ranking-size': `${percent(value, max)}%`,
    } as CSSProperties,
  });

  return (
    <BarsList
      data={data}
      barsLabel={label}
      valueLabel={valueLabel}
      valueFormatter={format}
      getBarProps={barProps}
      barHeight={BAR_HEIGHT}
      classNames={BARS_CLASSES}
      className="tabular"
    />
  );
};
