import type { CSSProperties, FC } from 'react';

import classes from './Shuttle.module.css';

type Props = { className?: string; style?: CSSProperties };

export const Shuttle: FC<Props> = ({ className, style }) => (
  <g className={className} style={style}>
    <path d="M0 -12 L-9 -34 L9 -34 Z" className={classes.skirt} />
    <path d="M-3 -13 L-6 -33 M3 -13 L6 -33 M0 -13 L0 -34" className={classes.feathers} />
    <circle cx="0" cy="-8" r="7" className={classes.cork} />
  </g>
);

type IconProps = { size: number; className?: string };

export const ShuttleIcon: FC<IconProps> = ({ size, className }) => (
  <svg viewBox="-12 -37 24 37" width={size * (24 / 37)} height={size} className={className} aria-hidden="true">
    <Shuttle />
  </svg>
);
