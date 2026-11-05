import { memo } from 'react';

import classes from './CourtTexture.module.css';

export const CourtTexture = memo(() => (
  <svg className={classes.texture} viewBox="0 0 1340 610" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="3">
      <rect x="2" y="2" width="1336" height="606" />
      <path d="M2 48H1338M2 562H1338M78 2V608M1262 2V608M472 2V608M868 2V608M2 305H472M868 305H1338" />
      <path d="M670 2V608" strokeDasharray="10 8" />
    </g>
  </svg>
));
