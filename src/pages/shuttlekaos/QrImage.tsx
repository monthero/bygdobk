import { memo, useMemo } from 'react';
import { encode } from 'uqr';

import classes from './QrImage.module.css';

const QUIET_ZONE = 4;

const modulePath = (rows: boolean[][]) => {
  let path = '';
  for (const [y, row] of rows.entries()) {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (row[x]) x += 1;
      path += `M${start} ${y}h${x - start}v1h${start - x}z`;
    }
  }
  return path;
};

const qrSource = (value: string) => {
  const { size, data } = encode(value, { ecc: 'M', border: QUIET_ZONE });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><path d="${modulePath(data)}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

type Props = { value: string; label: string };

export const QrImage = memo<Props>(({ value, label }) => {
  const src = useMemo(() => qrSource(value), [value]);
  return <img src={src} alt={label} className={classes.tile} />;
});
