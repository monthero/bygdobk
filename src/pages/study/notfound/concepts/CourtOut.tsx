import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Group, Stack, Text, Title, UnstyledButton, VisuallyHidden } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useCallback, useState, type CSSProperties, type FC } from 'react';

import { ArrowCounterClockwise, CalendarBlank, House } from '~/components/ui';

import classes from './CourtOut.module.css';

type Vec2 = readonly [number, number];
type Vec3 = readonly [number, number, number];
type Sample = { t: number; p: Vec3 };

const HALF_LENGTH = 6.7;
const HALF_WIDTH = 3.05;
const SINGLES = 2.59;
const SHORT_SERVICE = 1.98;
const LONG_SERVICE = 5.94;
const LINE = 0.04;
const OUTER_EDGE = HALF_LENGTH + LINE * 0.5;
const NET_POST = 1.55;
const NET_CENTER = 1.524;
const NET_DEPTH = 0.76;
const TAPE = 0.075;
const CORK_RADIUS = 0.013;

const EYE: Vec3 = [10.2, 2.5, 8.6];
const LOOK: Vec3 = [0.3, 1.4, -1.1];
const VIEW_WIDTH = 760;
const VIEW_HEIGHT = 440;
const PAD_LEFT = 36;
const PAD_RIGHT = 170;
const PAD_TOP = 40;
const PAD_BOTTOM = 36;

const GRAVITY = 9.81;
const DRAG = GRAVITY / (6.8 * 6.8);
const STEP = 1 / 600;
const HIT: Vec3 = [-5.4, 2.5, 0.9];
const LAUNCH: Vec3 = [40.4432, 20.8532, -6.2206];
const SKID_TIME = 0.24;
const SKID_LENGTH = 0.12;
const HOP = 0.03;
const SHUTTLE_ZOOM = 0.0062;

const SLOW = 1.5;
const START = 0.5;
const PUSH = 1.07;

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a: Vec3): Vec3 => {
  const length = Math.hypot(...a);
  return [a[0] / length, a[1] / length, a[2] / length];
};

const FORWARD = unit(sub(LOOK, EYE));
const RIGHT = unit(cross(FORWARD, [0, 1, 0]));
const UP = cross(RIGHT, FORWARD);

const depthOf = (p: Vec3) => dot(sub(p, EYE), FORWARD);
const rawProject = (p: Vec3): Vec2 => {
  const d = sub(p, EYE);
  const depth = dot(d, FORWARD);
  return [dot(d, RIGHT) / depth, -dot(d, UP) / depth];
};

const simulate = (): Sample[] => {
  const samples: Sample[] = [];
  let [x, y, z] = HIT;
  let [vx, vy, vz] = LAUNCH;
  let [px, py, pz] = HIT;
  let t = 0;
  let step = 0;
  while (y > 0) {
    if (step % 5 === 0) samples.push({ t, p: [x, y, z] });
    [px, py, pz] = [x, y, z];
    const speed = Math.hypot(vx, vy, vz);
    vx -= DRAG * speed * vx * STEP;
    vy -= (GRAVITY + DRAG * speed * vy) * STEP;
    vz -= DRAG * speed * vz * STEP;
    x += vx * STEP;
    y += vy * STEP;
    z += vz * STEP;
    t += STEP;
    step += 1;
  }
  const f = py / (py - y);
  const land: Vec3 = [px + (x - px) * f, 0, pz + (z - pz) * f];
  const landTime = t - STEP * (1 - f);
  samples.push({ t: landTime, p: land });
  const flat = Math.hypot(vx, vz);
  for (let i = 1; i <= 10; i += 1) {
    const along = i / 10;
    const slide = SKID_LENGTH * along;
    const hop = HOP * Math.sin(Math.PI * Math.min(along / 0.5, 1));
    const time = landTime + (1 - Math.sqrt(1 - along)) * SKID_TIME;
    samples.push({ t: time, p: [land[0] + (vx / flat) * slide, hop, land[2] + (vz / flat) * slide] });
  }
  return samples;
};

const SAMPLES = simulate();
const LANDED = SAMPLES.findIndex((s) => s.p[1] === 0);
const LAST = SAMPLES.at(-1) ?? { t: 1, p: HIT };
const DURATION = LAST.t;
const LAND_TIME = SAMPLES[LANDED]?.t ?? DURATION;
const LAND_POINT = SAMPLES[LANDED]?.p ?? HIT;

const FRAME_RAW = [
  [-HALF_LENGTH, 0, -HALF_WIDTH],
  [HALF_LENGTH, 0, -HALF_WIDTH],
  [HALF_LENGTH, 0, HALF_WIDTH],
  [-HALF_LENGTH, 0, HALF_WIDTH],
  ...SAMPLES.map((s) => s.p),
].map((p) => rawProject([p[0] ?? 0, p[1] ?? 0, p[2] ?? 0]));
const MIN_X = Math.min(...FRAME_RAW.map((p) => p[0]));
const MAX_X = Math.max(...FRAME_RAW.map((p) => p[0]));
const MIN_Y = Math.min(...FRAME_RAW.map((p) => p[1]));
const MAX_Y = Math.max(...FRAME_RAW.map((p) => p[1]));
const FIT_WIDTH = VIEW_WIDTH - PAD_LEFT - PAD_RIGHT;
const ZOOM = Math.min(FIT_WIDTH / (MAX_X - MIN_X), (VIEW_HEIGHT - PAD_TOP - PAD_BOTTOM) / (MAX_Y - MIN_Y));
const OFFSET_X = PAD_LEFT + (FIT_WIDTH - (MAX_X - MIN_X) * ZOOM) * 0.5 - MIN_X * ZOOM;
const OFFSET_Y = PAD_TOP - MIN_Y * ZOOM;

const project = (p: Vec3): Vec2 => {
  const [x, y] = rawProject(p);
  return [x * ZOOM + OFFSET_X, y * ZOOM + OFFSET_Y];
};
const pixelsPerMeter = (p: Vec3) => ZOOM / depthOf(p);

const fmt = (n: number) => n.toFixed(2);
const svgPath = (points: Vec2[], close = false) =>
  points.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p[0])} ${fmt(p[1])}`).join('') + (close ? 'Z' : '');
const toPath = (points: Vec3[], close = false) => svgPath(points.map(project), close);
const mirror = (p: Vec3): Vec3 => [p[0], -p[1], p[2]];

const floorRect = (x0: number, x1: number, z0: number, z1: number) =>
  toPath(
    [
      [x0, 0, z0],
      [x1, 0, z0],
      [x1, 0, z1],
      [x0, 0, z1],
    ],
    true,
  );

const lineAlongX = (z: number, x0: number, x1: number) => floorRect(x0, x1, z - LINE * 0.5, z + LINE * 0.5);
const lineAlongZ = (x: number, z0: number, z1: number) => floorRect(x - LINE * 0.5, x + LINE * 0.5, z0, z1);

const COURT_LINES = [
  lineAlongZ(-HALF_LENGTH, -HALF_WIDTH, HALF_WIDTH),
  lineAlongZ(HALF_LENGTH, -HALF_WIDTH, HALF_WIDTH),
  lineAlongZ(-LONG_SERVICE, -HALF_WIDTH, HALF_WIDTH),
  lineAlongZ(LONG_SERVICE, -HALF_WIDTH, HALF_WIDTH),
  lineAlongZ(-SHORT_SERVICE, -HALF_WIDTH, HALF_WIDTH),
  lineAlongZ(SHORT_SERVICE, -HALF_WIDTH, HALF_WIDTH),
  lineAlongX(-HALF_WIDTH, -HALF_LENGTH, HALF_LENGTH),
  lineAlongX(HALF_WIDTH, -HALF_LENGTH, HALF_LENGTH),
  lineAlongX(-SINGLES, -HALF_LENGTH, HALF_LENGTH),
  lineAlongX(SINGLES, -HALF_LENGTH, HALF_LENGTH),
  lineAlongX(0, -HALF_LENGTH, -SHORT_SERVICE),
  lineAlongX(0, SHORT_SERVICE, HALF_LENGTH),
].join('');
const BASELINE_NEAR = lineAlongZ(HALF_LENGTH, -HALF_WIDTH, HALF_WIDTH);

const MAT_X = HALF_LENGTH + 1.6;
const MAT_Z = HALF_WIDTH + 1.2;
const MAT = floorRect(-MAT_X, MAT_X, -MAT_Z, MAT_Z);
const GRID_STEP = 0.5;
const GRID = [
  ...Array.from({ length: Math.round((MAT_X * 2) / GRID_STEP) + 1 }, (_, i) => {
    const x = -MAT_X + i * GRID_STEP;
    return toPath([
      [x, 0, -MAT_Z],
      [x, 0, MAT_Z],
    ]);
  }),
  ...Array.from({ length: Math.round((MAT_Z * 2) / GRID_STEP) + 1 }, (_, i) => {
    const z = -MAT_Z + i * GRID_STEP;
    return toPath([
      [-MAT_X, 0, z],
      [MAT_X, 0, z],
    ]);
  }),
].join('');

const RULER = Array.from({ length: 61 }, (_, i) => {
  const z = -HALF_WIDTH + i * 0.1;
  const long = i % 5 === 0;
  return toPath([
    [OUTER_EDGE + 0.08, 0, z],
    [OUTER_EDGE + (long ? 0.32 : 0.18), 0, z],
  ]);
}).join('');

const netTop = (z: number) => NET_POST - (NET_POST - NET_CENTER) * (1 - (z / HALF_WIDTH) ** 2);
const NET_Z = Array.from({ length: 41 }, (_, i) => -HALF_WIDTH + (i / 40) * HALF_WIDTH * 2);
const NET_TOP_EDGE: Vec3[] = NET_Z.map((z) => [0, netTop(z), z]);
const TAPE_BOTTOM_EDGE: Vec3[] = NET_Z.map((z) => [0, netTop(z) - TAPE, z]);
const NET_BOTTOM_EDGE: Vec3[] = NET_Z.map((z) => [0, netTop(z) - NET_DEPTH, z]);

const NET_BODY = toPath([...TAPE_BOTTOM_EDGE, ...NET_BOTTOM_EDGE.toReversed()], true);
const NET_TAPE = toPath([...NET_TOP_EDGE, ...TAPE_BOTTOM_EDGE.toReversed()], true);
const NET_EDGE = toPath(NET_TOP_EDGE);
const NET_CORD = toPath(NET_BOTTOM_EDGE);
const NET_MESH = [
  ...Array.from({ length: 61 }, (_, i) => {
    const z = -HALF_WIDTH + (i / 60) * HALF_WIDTH * 2;
    return toPath([
      [0, netTop(z) - TAPE, z],
      [0, netTop(z) - NET_DEPTH, z],
    ]);
  }),
  ...Array.from({ length: 7 }, (_, i) => toPath(NET_Z.map((z) => [0, netTop(z) - TAPE - (i + 1) * 0.1, z]))),
].join('');
const NET_REFLECTION = toPath([...NET_TOP_EDGE.map(mirror), ...NET_BOTTOM_EDGE.map(mirror).toReversed()], true);
const NET_EDGE_REFLECTION = toPath(NET_TOP_EDGE.map(mirror));

const REFLECTION_TOP = project([0, 0, 0])[1];
const REFLECTION_BOTTOM = project([0, -NET_POST, 0])[1];

const postQuad = (z: number, height: number) => {
  const base = project([0, 0, z]);
  const top = project([0, height, z]);
  const half = pixelsPerMeter([0, 0.8, z]) * 0.028;
  return `M${fmt(base[0] - half)} ${fmt(base[1])}L${fmt(top[0] - half)} ${fmt(top[1])}L${fmt(top[0] + half)} ${fmt(top[1])}L${fmt(base[0] + half)} ${fmt(base[1])}Z`;
};
const POSTS = [-HALF_WIDTH, HALF_WIDTH].map((z) => ({
  body: postQuad(z, NET_POST + 0.03),
  reflection: postQuad(z, -(NET_POST + 0.03)),
  base: project([0, 0, z]),
}));

const circleOnFloor = (cx: number, cz: number, r: number) =>
  toPath(
    Array.from({ length: 32 }, (_, i) => {
      const a = (i / 32) * Math.PI * 2;
      return [cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r];
    }),
    true,
  );

const cumulative = (points: Vec2[]) => {
  const lengths = [0];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1] ?? [0, 0];
    const b = points[i] ?? [0, 0];
    lengths.push((lengths.at(-1) ?? 0) + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = lengths.at(-1) || 1;
  return lengths.map((l) => l / total);
};

const FLIGHT_SCREEN = SAMPLES.map((s) => project(s.p));
const GROUND_SCREEN = SAMPLES.map((s) => project([s.p[0], 0, s.p[2]]));
const FLIGHT_PROGRESS = cumulative(FLIGHT_SCREEN);
const GROUND_PROGRESS = cumulative(GROUND_SCREEN);
const TRAIL_POINTS = FLIGHT_SCREEN.slice(0, LANDED + 1);
const TRAIL_PROGRESS = cumulative(TRAIL_POINTS);
const TRAIL_PATH = svgPath(TRAIL_POINTS);
const TRAIL_START = TRAIL_POINTS.at(0) ?? [0, 0];
const TRAIL_END = TRAIL_POINTS.at(-1) ?? [0, 0];

const easing = (values: (sample: Sample, index: number) => number) => {
  const stops = SAMPLES.flatMap((sample, i) =>
    i % 3 === 0 || i >= LANDED ? [`${values(sample, i).toFixed(4)} ${((sample.t / DURATION) * 100).toFixed(2)}%`] : [],
  );
  return `linear(${stops.join(', ')})`;
};

const shuttleScale = (s: Sample) => pixelsPerMeter(s.p) * SHUTTLE_ZOOM;
const shadowScale = (s: Sample) => pixelsPerMeter([s.p[0], 0, s.p[2]]) * SHUTTLE_ZOOM * (1 + s.p[1] * 0.35);
const shadowOpacity = (s: Sample) => 0.7 * Math.exp(-s.p[1] * 0.9);

const TIMING = { animationDuration: `${(DURATION * SLOW).toFixed(3)}s`, animationDelay: `${START}s` };

const FLIGHT_STYLE: CSSProperties = {
  ...TIMING,
  offsetPath: `path('${svgPath(FLIGHT_SCREEN)}')`,
  animationTimingFunction: easing((_, i) => FLIGHT_PROGRESS[i] ?? 1),
};
const SHUTTLE_SCALE_STYLE: CSSProperties = {
  ...TIMING,
  scale: shuttleScale(LAST).toFixed(4),
  animationTimingFunction: easing(shuttleScale),
};
const GROUND_STYLE: CSSProperties = {
  ...TIMING,
  offsetPath: `path('${svgPath(GROUND_SCREEN)}')`,
  animationTimingFunction: easing((_, i) => GROUND_PROGRESS[i] ?? 1),
};
const SHADOW_SCALE_STYLE: CSSProperties = {
  ...TIMING,
  scale: shadowScale(LAST).toFixed(4),
  animationTimingFunction: easing(shadowScale),
};
const SHADOW_FADE_STYLE: CSSProperties = {
  ...TIMING,
  opacity: shadowOpacity(LAST).toFixed(3),
  animationTimingFunction: easing(shadowOpacity),
};
const TRAIL_STYLE: CSSProperties = {
  ...TIMING,
  animationTimingFunction: easing((_, i) => 1 - (TRAIL_PROGRESS[Math.min(i, LANDED)] ?? 1)),
};

const DOTS = SAMPLES.slice(0, LANDED).flatMap((sample, i) => {
  const point = FLIGHT_SCREEN[i];
  if (i % 9 !== 0 || !point) return [];
  return [{ key: i, x: point[0], y: point[1], style: { animationDelay: `${(START + sample.t * SLOW).toFixed(3)}s` } }];
});

const LAND_SCREEN = project(LAND_POINT);
const CENTER: Vec2 = [VIEW_WIDTH * 0.5, VIEW_HEIGHT * 0.5];
const PUSH_ORIGIN: Vec2 = [
  CENTER[0] + (LAND_SCREEN[0] - CENTER[0]) * 0.5,
  CENTER[1] + (LAND_SCREEN[1] - CENTER[1]) * 0.5,
];
const pushed = (p: Vec2): Vec2 => [
  PUSH_ORIGIN[0] + (p[0] - PUSH_ORIGIN[0]) * PUSH,
  PUSH_ORIGIN[1] + (p[1] - PUSH_ORIGIN[1]) * PUSH,
];
const LAND_FINAL = pushed(LAND_SCREEN);

const LAND_AT = START + LAND_TIME * SLOW;
const INSET_AT = START + DURATION * SLOW + 0.1;
const CALL_AT = INSET_AT + 0.5;

const STAGE_STYLE = {
  '--court-out-start': `${START}s`,
  '--court-out-land': `${LAND_AT.toFixed(2)}s`,
  '--court-out-inset': `${INSET_AT.toFixed(2)}s`,
  '--court-out-call': `${CALL_AT.toFixed(2)}s`,
} as CSSProperties;

const CAMERA_STYLE: CSSProperties = {
  transformOrigin: `${fmt(PUSH_ORIGIN[0])}px ${fmt(PUSH_ORIGIN[1])}px`,
  scale: String(PUSH),
  animationDelay: `${START}s`,
  animationDuration: `${(INSET_AT - START).toFixed(2)}s`,
};

const MARK = circleOnFloor(LAND_POINT[0], LAND_POINT[2], 0.1);
const PULSE = circleOnFloor(LAND_POINT[0], LAND_POINT[2], 0.32);

const INSET_R = 70;
const INSET: Vec2 = [VIEW_WIDTH - 96, 118];
const INSET_SCALE = 6.2;
const INSET_GAP = (LAND_POINT[0] - CORK_RADIUS - OUTER_EDGE) * 100;
const INSET_SHIFT = (INSET_GAP - LINE * 100) * 0.5;
const insetX = (cm: number) => INSET[0] + (cm - INSET_SHIFT) * INSET_SCALE;
const INSET_LINE = { x: insetX(-LINE * 100), width: LINE * 100 * INSET_SCALE };
const INSET_MARK = { x: insetX(INSET_GAP + CORK_RADIUS * 100), r: CORK_RADIUS * 100 * INSET_SCALE };
const INSET_BRACKET = `M${fmt(insetX(0))} ${INSET[1] + 26}v6H${fmt(insetX(INSET_GAP))}v-6`;
const INSET_GRID = Array.from({ length: 13 }, (_, i) => {
  const offset = (i - 6) * 12;
  return `M${INSET[0] + offset} ${INSET[1] - INSET_R}V${INSET[1] + INSET_R}M${INSET[0] - INSET_R} ${INSET[1] + offset}H${INSET[0] + INSET_R}`;
}).join('');
const LEADER_ANGLE = Math.atan2(LAND_FINAL[1] - INSET[1], LAND_FINAL[0] - INSET[0]);
const LEADER = svgPath([
  [INSET[0] + Math.cos(LEADER_ANGLE) * (INSET_R + 4), INSET[1] + Math.sin(LEADER_ANGLE) * (INSET_R + 4)],
  [LAND_FINAL[0] - Math.cos(LEADER_ANGLE) * 9, LAND_FINAL[1] - Math.sin(LEADER_ANGLE) * 9],
]);

const BRACKET = 16;
const BRACKET_INSET = 14;
const CORNERS = [
  `M${BRACKET_INSET} ${BRACKET_INSET + BRACKET}V${BRACKET_INSET}H${BRACKET_INSET + BRACKET}`,
  `M${VIEW_WIDTH - BRACKET_INSET - BRACKET} ${BRACKET_INSET}H${VIEW_WIDTH - BRACKET_INSET}V${BRACKET_INSET + BRACKET}`,
  `M${VIEW_WIDTH - BRACKET_INSET} ${VIEW_HEIGHT - BRACKET_INSET - BRACKET}V${VIEW_HEIGHT - BRACKET_INSET}H${VIEW_WIDTH - BRACKET_INSET - BRACKET}`,
  `M${BRACKET_INSET + BRACKET} ${VIEW_HEIGHT - BRACKET_INSET}H${BRACKET_INSET}V${VIEW_HEIGHT - BRACKET_INSET - BRACKET}`,
].join('');

const SHUTTLE_FEATHERS = Array.from({ length: 7 }, (_, i) => {
  const f = (i - 3) / 3;
  return `M-24 ${fmt(f * 11)}L-86 ${fmt(f * 30)}`;
}).join('');

const Shuttle: FC = () => (
  <g className={classes.shuttleBody}>
    <path d="M-22 -12 L-86 -32 Q-89 0 -86 32 L-22 12 Z" className={classes.skirt} />
    <path d={SHUTTLE_FEATHERS} className={classes.quills} />
    <path d="M-86 -32 Q-90 0 -86 32" className={classes.rim} />
    <path d="M-44 -18.5 Q-46 0 -44 18.5 M-60 -23.5 Q-62 0 -60 23.5" className={classes.thread} />
    <rect x="-27" y="-13.2" width="7" height="26.4" rx="1.5" className={classes.band} />
    <path d="M-20 -13 L-11 -13 A13 13 0 0 1 -11 13 L-20 13 Z" className={classes.cork} />
    <path d="M-15 -9 L-9 -9 A8 8 0 0 1 -3 -4" className={classes.shine} />
  </g>
);

const Defs: FC = () => (
  <defs>
    <linearGradient id="court-out-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" className={classes.skyTop} />
      <stop offset="1" className={classes.skyBottom} />
    </linearGradient>
    <linearGradient id="court-out-glass" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2={VIEW_HEIGHT}>
      <stop offset="0" className={classes.glassFar} />
      <stop offset="1" className={classes.glassNear} />
    </linearGradient>
    <linearGradient id="court-out-sheen" gradientUnits="userSpaceOnUse" x1="80" y1="140" x2="620" y2="440">
      <stop offset="0.3" className={classes.sheenOff} />
      <stop offset="0.52" className={classes.sheenOn} />
      <stop offset="0.74" className={classes.sheenOff} />
    </linearGradient>
    <radialGradient id="court-out-vignette" cx="0.5" cy="0.55" r="0.75">
      <stop offset="0.55" className={classes.vignetteOff} />
      <stop offset="1" className={classes.vignetteOn} />
    </radialGradient>
    <linearGradient
      id="court-out-reflection"
      gradientUnits="userSpaceOnUse"
      x1="0"
      y1={REFLECTION_TOP}
      x2="0"
      y2={REFLECTION_BOTTOM}
    >
      <stop offset="0" className={classes.reflectOn} />
      <stop offset="1" className={classes.reflectOff} />
    </linearGradient>
    <linearGradient
      id="court-out-trail"
      gradientUnits="userSpaceOnUse"
      x1={TRAIL_START[0]}
      y1={TRAIL_START[1]}
      x2={TRAIL_END[0]}
      y2={TRAIL_END[1]}
    >
      <stop offset="0" className={classes.trailFaint} />
      <stop offset="0.35" className={classes.trailStrong} />
    </linearGradient>
    <linearGradient id="court-out-skirt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" className={classes.skirtLight} />
      <stop offset="0.55" className={classes.skirtMid} />
      <stop offset="1" className={classes.skirtShade} />
    </linearGradient>
    <radialGradient id="court-out-cork" cx="0.35" cy="0.35" r="0.8">
      <stop offset="0" className={classes.corkLight} />
      <stop offset="1" className={classes.corkShade} />
    </radialGradient>
    <pattern id="court-out-scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" className={classes.scanline} />
    </pattern>
    <clipPath id="court-out-mat">
      <path d={MAT} />
    </clipPath>
    <clipPath id="court-out-lens">
      <circle cx={INSET[0]} cy={INSET[1]} r={INSET_R} />
    </clipPath>
    <filter id="court-out-bloom" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.2" />
    </filter>
    <filter id="court-out-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" />
    </filter>
    <filter id="court-out-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" />
    </filter>
  </defs>
);

const Inset: FC = () => (
  <g className={classes.inset}>
    <path d={LEADER} className={classes.leader} />
    <circle cx={LAND_FINAL[0]} cy={LAND_FINAL[1]} r="8" className={classes.target} />
    <g className={classes.lens}>
      <circle cx={INSET[0]} cy={INSET[1]} r={INSET_R + 5} className={classes.lensHalo} filter="url(#court-out-glow)" />
      <g clipPath="url(#court-out-lens)">
        <rect
          x={INSET[0] - INSET_R}
          y={INSET[1] - INSET_R}
          width={INSET_R * 2}
          height={INSET_R * 2}
          className={classes.lensFloor}
        />
        <path d={INSET_GRID} className={classes.lensGrid} />
        <rect
          x={INSET_LINE.x}
          y={INSET[1] - INSET_R}
          width={INSET_LINE.width}
          height={INSET_R * 2}
          className={classes.glow}
          filter="url(#court-out-bloom)"
        />
        <rect
          x={INSET_LINE.x}
          y={INSET[1] - INSET_R}
          width={INSET_LINE.width}
          height={INSET_R * 2}
          className={classes.lensLine}
        />
        <ellipse
          cx={INSET_MARK.x + INSET_MARK.r * 0.8}
          cy={INSET[1] + 2}
          rx={INSET_MARK.r * 2.4}
          ry={INSET_MARK.r * 0.8}
          className={classes.lensSkid}
        />
        <circle cx={INSET_MARK.x} cy={INSET[1]} r={INSET_MARK.r} className={classes.lensMark} />
        <path d={INSET_BRACKET} className={classes.lensBracket} />
      </g>
      <circle cx={INSET[0]} cy={INSET[1]} r={INSET_R} className={classes.lensRim} />
    </g>
  </g>
);

const Stage: FC = () => {
  const { t } = useLingui();

  return (
    <figure className={classes.stage} style={STAGE_STYLE}>
      <VisuallyHidden component="figcaption">
        {t`Replay of a line call: the shuttle flies over the net and lands just past the baseline. The call is out.`}
      </VisuallyHidden>
      <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className={classes.art} aria-hidden>
        <Defs />
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#court-out-sky)" />

        <g className={classes.camera} style={CAMERA_STYLE}>
          <path d={MAT} fill="url(#court-out-glass)" />
          <g clipPath="url(#court-out-mat)">
            <path d={GRID} className={classes.grid} />
            <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#court-out-scan)" />
            <path d={NET_REFLECTION} fill="url(#court-out-reflection)" />
            <path d={NET_EDGE_REFLECTION} className={classes.edgeReflection} />
            {POSTS.map((post) => (
              <path key={post.reflection} d={post.reflection} fill="url(#court-out-reflection)" />
            ))}
          </g>
          <path d={MAT} fill="url(#court-out-sheen)" />
          <path d={MAT} className={classes.matEdge} />

          <path d={COURT_LINES} className={classes.glow} filter="url(#court-out-bloom)" />
          <path d={COURT_LINES} className={classes.lines} />
          <path d={RULER} className={classes.ruler} />
          <path d={BASELINE_NEAR} className={classes.baselineCall} filter="url(#court-out-bloom)" />

          {POSTS.map((post) => (
            <ellipse
              key={post.body}
              cx={post.base[0]}
              cy={post.base[1]}
              rx="9"
              ry="3"
              className={classes.contact}
              filter="url(#court-out-blur)"
            />
          ))}
          <path d={NET_BODY} className={classes.netBody} />
          <path d={NET_MESH} className={classes.mesh} />
          <path d={NET_CORD} className={classes.cord} />
          <path d={NET_TAPE} className={classes.tape} />
          <path d={NET_EDGE} className={classes.edgeGlow} filter="url(#court-out-glow)" />
          <path d={NET_EDGE} className={classes.edge} />
          {POSTS.map((post) => (
            <path key={post.body} d={post.body} className={classes.post} />
          ))}

          <path d={PULSE} className={classes.pulse} />
          <path d={MARK} className={classes.mark} />

          <path
            d={TRAIL_PATH}
            pathLength={1}
            className={classes.trailGlow}
            filter="url(#court-out-glow)"
            style={TRAIL_STYLE}
          />
          <path
            d={TRAIL_PATH}
            pathLength={1}
            className={classes.trail}
            stroke="url(#court-out-trail)"
            style={TRAIL_STYLE}
          />
          {DOTS.map((sample) => (
            <circle key={sample.key} cx={sample.x} cy={sample.y} r="2.1" className={classes.dot} style={sample.style} />
          ))}

          <g className={classes.ground} style={GROUND_STYLE}>
            <g className={classes.scaled} style={SHADOW_SCALE_STYLE}>
              <ellipse
                cx="-42"
                cy="20"
                rx="50"
                ry="9"
                className={classes.shadow}
                style={SHADOW_FADE_STYLE}
                filter="url(#court-out-blur)"
              />
            </g>
          </g>
          <g className={classes.flight} style={FLIGHT_STYLE}>
            <g className={classes.scaled} style={SHUTTLE_SCALE_STYLE}>
              <Shuttle />
            </g>
          </g>
        </g>

        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#court-out-vignette)" />
        <path d={CORNERS} className={classes.corners} />
        <Inset />
      </svg>

      <div className={classes.lowerThird}>
        <span className={classes.eyebrow}>
          <Trans>Challenge: page</Trans>
        </span>
        <span className={classes.verdict}>
          <Trans>Out</Trans>
        </span>
      </div>
    </figure>
  );
};

export const CourtOut: FC = () => {
  const { t } = useLingui();
  const [take, setTake] = useState(0);
  const replay = useCallback(() => setTake((n) => n + 1), []);

  return (
    <Stack align="center" ta="center" gap="lg" className={classes.root}>
      <div className={classes.scene}>
        <Stage key={take} />
        <UnstyledButton className={classes.replay} onClick={replay} aria-label={t`Play the replay again`}>
          <ArrowCounterClockwise aria-hidden />
          <Trans>Replay</Trans>
        </UnstyledButton>
      </div>

      <Badge size="lg" variant="light" color="red" radius="xl">
        <Trans>404 · Out</Trans>
      </Badge>
      <Title order={1} className={classes.title}>
        <Trans>That one landed out</Trans>
      </Title>
      <Text size="lg" c="dimmed" maw={520}>
        <Trans>We checked the replay: this page is past the baseline. It may have moved, or the link has a typo.</Trans>
      </Text>
      <Group justify="center">
        <Button renderRoot={(props) => <Link to="/" {...props} />} leftSection={<House />} size="md">
          <Trans>Back to the front page</Trans>
        </Button>
        <Button
          renderRoot={(props) => <Link to="/trening" {...props} />}
          variant="default"
          leftSection={<CalendarBlank />}
          size="md"
        >
          <Trans>Training times</Trans>
        </Button>
      </Group>
    </Stack>
  );
};
