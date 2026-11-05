export const LENGTH = 13.4;
export const WIDTH = 6.1;
export const HALF = LENGTH / 2;
export const MIDDLE = WIDTH / 2;
export const SHORT_SERVICE = 1.98;
export const LONG_SERVICE = 0.76;
export const SINGLES = 0.46;
export const FRONT = HALF - SHORT_SERVICE;
export const BACK = HALF + SHORT_SERVICE;

export type Line = readonly [number, number, number, number];

export const LINES: Line[] = [
  [0, SINGLES, LENGTH, SINGLES],
  [0, WIDTH - SINGLES, LENGTH, WIDTH - SINGLES],
  [LONG_SERVICE, 0, LONG_SERVICE, WIDTH],
  [LENGTH - LONG_SERVICE, 0, LENGTH - LONG_SERVICE, WIDTH],
  [FRONT, 0, FRONT, WIDTH],
  [BACK, 0, BACK, WIDTH],
  [0, MIDDLE, FRONT, MIDDLE],
  [BACK, MIDDLE, LENGTH, MIDDLE],
];

export const NET: Line = [HALF, 0, HALF, WIDTH];

export const lineKey = ([x1, y1, x2, y2]: Line) => `${x1}-${y1}-${x2}-${y2}`;
