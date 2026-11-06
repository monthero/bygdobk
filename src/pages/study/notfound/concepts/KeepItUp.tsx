import type { MessageDescriptor } from '@lingui/core';
import { msg, plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Group, Kbd, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { createRef, memo, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { FC, KeyboardEvent, MouseEvent, PointerEvent, RefObject } from 'react';
import { z } from 'zod';

import { CalendarBlank, ClubLogo, House } from '~/components/ui';

import classes from './KeepItUp.module.css';

const VIEW_W = 360;
const VIEW_H = 320;
const WALL_BASE = 258;
const FLOOR_Y = 298;
const RACKET_Y = 206;
const REST_Y = RACKET_Y - 1;
const FLOOR_CONTACT = FLOOR_Y - 1;
const LYING_Y = FLOOR_Y - 3.5;
const LYING_ANGLE = (78 * Math.PI) / 180;
const SHUTTLE_SCALE = 0.62;
const STEP = 1 / 240;
const STEPS_PER_SECOND = 240;
const MAX_FRAME = 0.1;
// A real shuttle tops out near 6.7 m/s; same drag-to-gravity shape, scaled to this court.
const GRAVITY = 573;
const TERMINAL_SPEED = 233;
const DRAG = GRAVITY / TERMINAL_SPEED ** 2;
const LAUNCH_SPEED = 5 * TERMINAL_SPEED;
const PITCH_STIFFNESS = 3.6e-3;
const PITCH_DAMPING = 0.04;
const TURNOVER_NUDGE = 8;
const MAX_LAUNCH_ANGLE = 0.38;
const LAUNCH_ANGLE_LIMIT = 0.6;
const CENTER_PULL = 0.216;
const BASE_WOBBLE = 0.12;
const WOBBLE_PER_HIT = 0.004;
const RACKET_CARRY = 0.55;
const MAX_CARRY = 340;
const WALL_RESTITUTION = 0.3;
const WALL_FRICTION = 0.85;
const FLOOR_RESTITUTION = 0.2;
const MAX_HOP = 50;
const FLOOR_SLIDE = 0.3;
const FLOOR_FRICTION = Math.exp(-6 * STEP);
const TOPPLE_PUSH = 2.8;
const TOPPLE_GRAVITY = 24;
const TOPPLE_REBOUND = 0.28;
const TOPPLE_SETTLE = 1.6;
const HIT_TOP = RACKET_Y - 38;
const HIT_BOTTOM = RACKET_Y + 9;
const SWEET_Y = RACKET_Y - 8;
const HIT_REACH = 40;
const HEAD_HALF_WIDTH = 35;
const SWEET_SPOT = 0.45;
const RIM_START = 0.82;
const OFF_CENTER_POWER = 0.85;
const OFF_CENTER_TILT = 1.4;
const RIM_POWER = 0.62;
const RIM_KICK = 0.8;
const RIM_SPIN = 16;
const MIN_HIT_VY = -60;
const WEAK_POWER = 0.9;
const SWEET_BONUS = 0.12;
const POP_MARGIN = 8;
const SWING_WINDOW = 0.07;
const SWING_COOLDOWN = 0.4;
const RESTART_DELAY = 400;
const WALL_INSET = 22;
const RACKET_INSET = 44;
const RACKET_EASE = 1 - Math.exp(-16 * STEP);
const RACKET_VELOCITY_EASE = 1 - Math.exp(-40 * STEP);
const ARROW_STEP = 28;
const PACE_PER_HIT = 0.01;
const MAX_PACE_HITS = 40;
const RAD_TO_DEG = 180 / Math.PI;
const BEST_KEY = 'bigdo:404:keep-it-up:best';
const NON_ID_CHARS = /[^\w-]/g;
const SHUTTLE_SIZE = `scale(${SHUTTLE_SCALE})`;
const MESH_MAINS = [-28, -21, -14, -7, 0, 7, 14, 21, 28];
const MESH_CROSSES = [-7.5, -5, -2.5, 0, 2.5, 5, 7.5];
const GRIP_WRAPS = [48, 54, 60, 66];
const LAMP_GAP = 110;
const LAMP_MARGIN = 70;
const PANEL_GAP = 60;
const BURST_RAYS = [0, 60, 120, 180, 240, 300];
const FEATHER_SHAFTS = [-2, -1, 0, 1, 2];

const Phase = z.enum(['ready', 'playing', 'landing', 'missed']);
type Phase = z.infer<typeof Phase>;

const Quality = z.enum(['clean', 'offCenter', 'rim']);
type Quality = z.infer<typeof Quality>;

const CALLOUTS: Record<Quality, MessageDescriptor[]> = {
  [Quality.enum.clean]: [
    msg({
      message: 'Pock!',
      comment: 'Sound of a clean racket hit. Adapt the sound word, do not translate literally.',
    }),
    msg({
      message: 'Thwack!',
      comment: 'Sound of a clean racket hit. Adapt the sound word, do not translate literally.',
    }),
    msg({
      message: 'Tock!',
      comment: 'Sound of a clean racket hit. Adapt the sound word, do not translate literally.',
    }),
  ],
  [Quality.enum.offCenter]: [
    msg({ message: 'A bit off-center', comment: 'The shuttle hit the racket away from the middle' }),
    msg({ message: 'Missed the sweet spot', comment: 'The shuttle hit the racket away from the middle' }),
  ],
  [Quality.enum.rim]: [
    msg({ message: 'Oops, rim shot!', comment: 'The shuttle hit the racket frame, not the strings' }),
    msg({
      message: 'Pling! That hit the frame',
      comment:
        'Pling is the sound of the shuttle hitting the racket frame. Adapt the sound word, do not translate literally.',
    }),
    msg({ message: 'Frame shot!', comment: 'The shuttle hit the racket frame, not the strings' }),
  ],
};

type Sim = {
  width: number;
  phase: Phase;
  quality: Quality;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  restAngle: number;
  racketX: number;
  racketVx: number;
  targetX: number;
  prevX: number;
  prevY: number;
  prevAngle: number;
  prevRacketX: number;
  cooldown: number;
  swingLeft: number;
  hits: number;
  contactX: number;
  contactY: number;
  bounced: boolean;
  landedAt: number;
};

type SceneRefs = {
  svg: RefObject<SVGSVGElement | null>;
  shuttle: RefObject<SVGGElement | null>;
  shadow: RefObject<SVGEllipseElement | null>;
  racket: RefObject<SVGGElement | null>;
  racketShadow: RefObject<SVGEllipseElement | null>;
  swing: RefObject<SVGGElement | null>;
  burst: RefObject<SVGGElement | null>;
  burstRays: RefObject<SVGGElement | null>;
  pop: RefObject<SVGTextElement | null>;
};

const SWING_KEYFRAMES: Keyframe[] = [
  { transform: 'translateY(0) rotate(0deg)' },
  { transform: 'translateY(-10px) rotate(-7deg)', offset: 0.35 },
  { transform: 'translateY(0) rotate(0deg)' },
];
const SWING_TIMING: KeyframeAnimationOptions = { duration: 260, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' };
const BURST_KEYFRAMES: Keyframe[] = [
  { opacity: 1, transform: 'scale(0.5)' },
  { opacity: 0, transform: 'scale(1.4)' },
];
const BURST_TIMING: KeyframeAnimationOptions = { duration: 340, easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)' };
const POP_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: 'translateY(0) scale(0.8)' },
  { opacity: 1, transform: 'translateY(-14px) scale(1)', offset: 0.25 },
  { opacity: 0, transform: 'translateY(-34px) scale(1)' },
];
const POP_TIMING: KeyframeAnimationOptions = { duration: 1100, easing: 'ease-out' };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

const wrapRadians = (value: number) => Math.atan2(Math.sin(value), Math.cos(value));

const pace = (hits: number) => 1 + Math.min(hits, MAX_PACE_HITS) * PACE_PER_HIT;

const readBest = () => {
  try {
    const stored = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
};

const writeBest = (value: number) => {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    return;
  }
};

const createSim = (width = VIEW_W, racketX = width * 0.5): Sim => ({
  width,
  phase: Phase.enum.ready,
  quality: Quality.enum.clean,
  x: racketX,
  y: REST_Y,
  vx: 0,
  vy: 0,
  angle: 0,
  spin: 0,
  restAngle: 0,
  racketX,
  racketVx: 0,
  targetX: racketX,
  prevX: racketX,
  prevY: REST_Y,
  prevAngle: 0,
  prevRacketX: racketX,
  cooldown: 0,
  swingLeft: 0,
  hits: 0,
  contactX: racketX,
  contactY: REST_Y,
  bounced: false,
  landedAt: 0,
});

const launch = (sim: Sim, offset: number, power: number) => {
  const wobble = (Math.random() * 2 - 1) * (BASE_WOBBLE + Math.min(sim.hits, MAX_PACE_HITS) * WOBBLE_PER_HIT);
  const pull = (1 - (2 * sim.x) / sim.width) * CENTER_PULL;
  const angle = clamp(offset * MAX_LAUNCH_ANGLE + wobble + pull, -LAUNCH_ANGLE_LIMIT, LAUNCH_ANGLE_LIMIT);
  const speed = LAUNCH_SPEED * power;
  sim.vx = speed * Math.sin(angle) + clamp(sim.racketVx * RACKET_CARRY, -MAX_CARRY, MAX_CARRY);
  sim.vy = -speed * Math.cos(angle);
  sim.spin += sim.vx >= 0 ? -TURNOVER_NUDGE : TURNOVER_NUDGE;
  sim.contactX = sim.x;
  sim.contactY = sim.y;
};

const inReach = (sim: Sim) =>
  sim.y >= HIT_TOP && sim.y <= HIT_BOTTOM && sim.vy > MIN_HIT_VY && Math.abs(sim.x - sim.racketX) < HIT_REACH;

const strike = (sim: Sim) => {
  const dx = sim.x - sim.racketX;
  const spot = Math.abs(dx) / HEAD_HALF_WIDTH;
  const offset = dx / HIT_REACH;
  const timing = clamp(1 - Math.abs(sim.y - SWEET_Y) / (SWEET_Y - HIT_TOP), 0, 1);
  const power = WEAK_POWER + SWEET_BONUS * timing;
  sim.swingLeft = 0;
  sim.hits += 1;
  if (spot < SWEET_SPOT) {
    sim.quality = Quality.enum.clean;
    launch(sim, offset, power);
    return;
  }
  if (spot < RIM_START) {
    sim.quality = Quality.enum.offCenter;
    launch(sim, offset * OFF_CENTER_TILT, power * OFF_CENTER_POWER);
    return;
  }
  sim.quality = Quality.enum.rim;
  launch(sim, offset + (Math.random() * 2 - 1) * RIM_KICK, power * RIM_POWER);
  sim.spin += (Math.random() * 2 - 1) * RIM_SPIN;
};

const land = (sim: Sim) => {
  const wrapped = wrapRadians(sim.angle);
  sim.prevAngle += wrapped - sim.angle;
  sim.angle = wrapped;
  sim.y = FLOOR_CONTACT;
  sim.bounced = true;
  sim.vy = -Math.min(sim.vy * FLOOR_RESTITUTION, MAX_HOP);
  sim.vx *= FLOOR_SLIDE;
  const side = Math.abs(sim.angle) > 0.02 ? Math.sign(sim.angle) : -Math.sign(sim.vx) || 1;
  sim.restAngle = side * LYING_ANGLE;
  sim.spin = side * TOPPLE_PUSH;
};

const fly = (sim: Sim) => {
  const speed = Math.hypot(sim.vx, sim.vy);
  sim.vx -= DRAG * speed * sim.vx * STEP;
  sim.vy += (GRAVITY - DRAG * speed * sim.vy) * STEP;
  sim.x += sim.vx * STEP;
  sim.y += sim.vy * STEP;
  const wallRight = sim.width - WALL_INSET;
  if (sim.x < WALL_INSET || sim.x > wallRight) {
    sim.x = clamp(sim.x, WALL_INSET, wallRight);
    sim.vx *= -WALL_RESTITUTION;
    sim.vy *= WALL_FRICTION;
  }
  const heading = Math.atan2(sim.vy, sim.vx) - Math.PI * 0.5;
  sim.spin +=
    (PITCH_STIFFNESS * speed * speed * Math.sin(heading - sim.angle) - PITCH_DAMPING * speed * sim.spin) * STEP;
  sim.angle += sim.spin * STEP;
  if (sim.phase === Phase.enum.playing && sim.y > HIT_BOTTOM) sim.phase = Phase.enum.landing;
  if (sim.y >= FLOOR_CONTACT) land(sim);
};

const topple = (sim: Sim) => {
  const side = Math.sign(sim.restAngle);
  const tilt = Math.min(Math.abs(sim.angle), LYING_ANGLE);
  const ground = FLOOR_CONTACT - (FLOOR_CONTACT - LYING_Y) * (tilt / LYING_ANGLE);
  sim.vy += GRAVITY * STEP;
  sim.y += sim.vy * STEP;
  if (sim.y >= ground) {
    sim.y = ground;
    sim.vy = 0;
  }
  sim.vx *= FLOOR_FRICTION;
  sim.x += sim.vx * STEP;
  if (sim.spin === 0) return;
  sim.spin += side * (TOPPLE_PUSH + TOPPLE_GRAVITY * Math.sin(tilt)) * STEP;
  sim.angle += sim.spin * STEP;
  if (Math.abs(sim.angle) < LYING_ANGLE || Math.sign(sim.angle) !== side) return;
  sim.angle = sim.restAngle;
  sim.spin = Math.abs(sim.spin) > TOPPLE_SETTLE ? -sim.spin * TOPPLE_REBOUND : 0;
};

const moveRacket = (sim: Sim) => {
  const from = sim.racketX;
  sim.racketX += (sim.targetX - sim.racketX) * RACKET_EASE;
  sim.racketVx += ((sim.racketX - from) * STEPS_PER_SECOND - sim.racketVx) * RACKET_VELOCITY_EASE;
  if (Math.abs(sim.targetX - sim.racketX) >= 0.1) return;
  sim.racketX = sim.targetX;
  if (Math.abs(sim.racketVx) < 1) sim.racketVx = 0;
};

const step = (sim: Sim) => {
  sim.prevX = sim.x;
  sim.prevY = sim.y;
  sim.prevAngle = sim.angle;
  sim.prevRacketX = sim.racketX;
  sim.cooldown = Math.max(0, sim.cooldown - STEP);
  moveRacket(sim);
  if (sim.phase === Phase.enum.ready) {
    sim.x = sim.racketX;
    return;
  }
  if (sim.swingLeft > 0) {
    sim.swingLeft -= STEP;
    if (sim.phase === Phase.enum.playing && inReach(sim)) strike(sim);
  }
  if (sim.phase === Phase.enum.playing || (sim.phase === Phase.enum.landing && !sim.bounced)) fly(sim);
  else topple(sim);
};

const resize = (sim: Sim, width: number) => {
  if (sim.phase === Phase.enum.ready) {
    Object.assign(sim, createSim(width));
    return;
  }
  const shift = (width - sim.width) * 0.5;
  const shuttleX = (x: number) => clamp(x + shift, WALL_INSET, width - WALL_INSET);
  const racketX = (x: number) => clamp(x + shift, RACKET_INSET, width - RACKET_INSET);
  sim.width = width;
  sim.x = shuttleX(sim.x);
  sim.prevX = shuttleX(sim.prevX);
  sim.racketX = racketX(sim.racketX);
  sim.prevRacketX = racketX(sim.prevRacketX);
  sim.targetX = racketX(sim.targetX);
  sim.contactX += shift;
};

const isSettled = (sim: Sim) => {
  if (sim.racketX !== sim.targetX || sim.racketVx !== 0) return false;
  if (sim.phase === Phase.enum.ready) return true;
  return sim.phase === Phase.enum.missed && sim.spin === 0 && sim.vy === 0;
};

const paint = (sim: Sim, refs: SceneRefs, alpha: number) => {
  const x = lerp(sim.prevX, sim.x, alpha);
  const y = lerp(sim.prevY, sim.y, alpha);
  const angle = lerp(sim.prevAngle, sim.angle, alpha) * RAD_TO_DEG;
  const racketX = lerp(sim.prevRacketX, sim.racketX, alpha).toFixed(2);
  refs.shuttle.current?.setAttribute(
    'transform',
    `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})`,
  );
  refs.racket.current?.setAttribute('transform', `translate(${racketX} ${RACKET_Y})`);
  refs.racketShadow.current?.setAttribute('cx', racketX);
  const shadow = refs.shadow.current;
  if (shadow) {
    const closeness = clamp(1 - (FLOOR_Y - y) / 240, 0, 1);
    shadow.setAttribute('cx', x.toFixed(2));
    shadow.setAttribute('rx', (3 + closeness * 7).toFixed(2));
    shadow.style.opacity = (0.06 + closeness * 0.22).toFixed(3);
  }
};

const flash = (sim: Sim, refs: SceneRefs, message: string) => {
  refs.burst.current?.setAttribute('transform', `translate(${sim.contactX.toFixed(1)} ${sim.contactY.toFixed(1)})`);
  refs.burstRays.current?.animate(BURST_KEYFRAMES, BURST_TIMING);
  const pop = refs.pop.current;
  if (!pop) return;
  pop.textContent = message;
  const half = pop.getComputedTextLength() * 0.5 + POP_MARGIN;
  const x = half * 2 < sim.width ? clamp(sim.contactX, half, sim.width - half) : sim.width * 0.5;
  pop.setAttribute('x', (x - sim.contactX).toFixed(1));
  pop.animate(POP_KEYFRAMES, POP_TIMING);
};

const mirrored = (center: number, gap: number, reach: number) => {
  const count = Math.floor(reach / gap);
  return Array.from({ length: count * 2 + 1 }, (_, i) => center + (i - count) * gap);
};

const useViewWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [viewW, setViewW] = useState(VIEW_W);
  useLayoutEffect(() => {
    const field = ref.current;
    if (!field) return;
    const update = () => {
      if (field.clientHeight === 0) return;
      setViewW(Math.max(VIEW_W, Math.round((VIEW_H * field.clientWidth) / field.clientHeight)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(field);
    return () => observer.disconnect();
  }, []);
  return { ref, viewW };
};

const RACKET_STRINGS_PATH = [...MESH_MAINS.map((x) => `M${x} -12V12`), ...MESH_CROSSES.map((y) => `M-40 ${y}H40`)].join(
  '',
);

const ShuttleShape: FC = () => {
  const id = `shuttle-${useId().replace(NON_ID_CHARS, '')}`;
  return (
    <>
      <defs>
        <linearGradient id={`${id}-skirt`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" className={classes.skirtLit} />
          <stop offset="0.55" className={classes.skirtLit} />
          <stop offset="1" className={classes.skirtShade} />
        </linearGradient>
        <radialGradient id={`${id}-cork`} cx="0.35" cy="0.35" r="0.8">
          <stop offset="0" className={classes.corkLit} />
          <stop offset="1" className={classes.corkShade} />
        </radialGradient>
      </defs>
      <path
        className={classes.skirt}
        fill={`url(#${id}-skirt)`}
        d="M-6.5 -13.5L-16 -42Q-13 -46 -9.6 -43Q-6.4 -47 -3.2 -43.6Q0 -47.5 3.2 -43.6Q6.4 -47 9.6 -43Q13 -46 16 -42L6.5 -13.5Z"
      />
      <path className={classes.quills} d={FEATHER_SHAFTS.map((k) => `M${k * 2.6} -14L${k * 6.2} -43`).join('')} />
      <path className={classes.thread} d="M-9.3 -22Q0 -20 9.3 -22M-12 -30Q0 -28 12 -30" />
      <path className={classes.cork} fill={`url(#${id}-cork)`} d="M-7 -11V-7A7 7 0 0 0 7 -7V-11Z" />
      <rect className={classes.band} x="-7.5" y="-14" width="15" height="3.6" rx="1" />
    </>
  );
};

export const Shuttle = memo(ShuttleShape);

const Racket: FC = () => {
  const faceId = `racket-${useId().replace(NON_ID_CHARS, '')}`;
  return (
    <>
      <clipPath id={faceId}>
        <ellipse rx="33" ry="9.5" />
      </clipPath>
      <path className={classes.throat} d="M-9 9.5Q-2 13 0 24M9 9.5Q2 13 0 24" />
      <line className={classes.shaft} x1="0" y1="22" x2="0" y2="46" />
      <rect className={classes.grip} x="-5.5" y="44" width="11" height="26" rx="4" />
      <path className={classes.wrap} d={GRIP_WRAPS.map((y) => `M-5.5 ${y + 3}L5.5 ${y}`).join('')} />
      <rect className={classes.butt} x="-6" y="68" width="12" height="4" rx="2" />
      <ellipse className={classes.face} rx="33" ry="9.5" />
      <path className={classes.strings} d={RACKET_STRINGS_PATH} clipPath={`url(#${faceId})`} />
      <ellipse className={classes.frame} rx="35" ry="11" />
      <ellipse className={classes.frameShine} rx="35" ry="11" />
    </>
  );
};

type CourtProps = { viewW: number; refs?: SceneRefs; label?: string };

const CourtScene: FC<CourtProps> = ({ viewW, refs, label }) => {
  const id = `keep-it-up-${useId().replace(NON_ID_CHARS, '')}`;
  const center = viewW * 0.5;
  return (
    <svg
      ref={refs?.svg}
      viewBox={`0 0 ${viewW} ${VIEW_H}`}
      className={classes.scene}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <linearGradient id={`${id}-wall`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" className={classes.wallTop} />
          <stop offset="1" className={classes.wallBottom} />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className={classes.glowCenter} />
          <stop offset="1" className={classes.glowEdge} />
        </radialGradient>
      </defs>
      <rect width={viewW} height={WALL_BASE} fill={`url(#${id}-wall)`} />
      {mirrored(center, LAMP_GAP, center - LAMP_MARGIN).map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <ellipse cy="20" rx="90" ry="170" fill={`url(#${id}-glow)`} />
          <line className={classes.lampCord} y1="0" y2="12" />
          <path className={classes.lamp} d="M-13 20Q-13 12 0 12Q13 12 13 20Z" />
          <ellipse className={classes.bulb} cy="20.5" rx="9" ry="1.8" />
        </g>
      ))}
      <g className={classes.decal} transform={`translate(${center - 22} 96)`}>
        <ClubLogo mark height={58} />
      </g>
      <rect className={classes.padding} y={WALL_BASE - 34} width={viewW} height="34" />
      <line className={classes.paddingEdge} x1="0" x2={viewW} y1={WALL_BASE - 34} y2={WALL_BASE - 34} />
      <path
        className={classes.paddingEdge}
        d={mirrored(center, PANEL_GAP, center - PANEL_GAP * 0.5)
          .map((x) => `M${x} ${WALL_BASE - 34}V${WALL_BASE}`)
          .join('')}
      />
      <rect className={classes.floor} y={WALL_BASE} width={viewW} height={VIEW_H - WALL_BASE} />
      <line className={classes.floorEdge} x1="0" x2={viewW} y1={WALL_BASE} y2={WALL_BASE} />
      <path
        className={classes.courtLine}
        d={`M0 ${WALL_BASE + 12}H${viewW}M64 ${WALL_BASE + 12}L28 ${VIEW_H}M${viewW - 64} ${WALL_BASE + 12}L${viewW - 28} ${VIEW_H}`}
      />
      <ellipse ref={refs?.racketShadow} className={classes.shadow} cx={center} cy={FLOOR_Y + 2} rx="30" ry="3.4" />
      <ellipse ref={refs?.shadow} className={classes.shadow} cx={center} cy={FLOOR_Y + 2} rx="5" ry="1.7" />
      <g ref={refs?.racket} transform={`translate(${center} ${RACKET_Y})`}>
        <g ref={refs?.swing} className={classes.swing}>
          <Racket />
        </g>
      </g>
      <g ref={refs?.shuttle} transform={`translate(${center} ${REST_Y}) rotate(0)`}>
        <g transform={SHUTTLE_SIZE}>
          <Shuttle />
        </g>
      </g>
      <g ref={refs?.burst}>
        <g ref={refs?.burstRays} className={classes.burst}>
          {BURST_RAYS.map((deg) => (
            <line key={deg} x1="0" y1="-12" x2="0" y2="-20" transform={`rotate(${deg})`} />
          ))}
        </g>
        <text ref={refs?.pop} className={classes.pop} y="-34" textAnchor="middle" />
      </g>
    </svg>
  );
};

const Court = memo(CourtScene);

const createRefs = (): SceneRefs => ({
  svg: createRef(),
  shuttle: createRef(),
  shadow: createRef(),
  racket: createRef(),
  racketShadow: createRef(),
  swing: createRef(),
  burst: createRef(),
  burstRays: createRef(),
  pop: createRef(),
});

const KeepItUpGame: FC = () => {
  const { t, i18n } = useLingui();
  const [refs] = useState(createRefs);
  const { ref: fieldRef, viewW } = useViewWidth();
  const sim = useRef<Sim>(createSim());
  const frame = useRef(0);
  const [phase, setPhase] = useState<Phase>(Phase.enum.ready);
  const [hits, setHits] = useState(0);
  const [callout, setCallout] = useState('');
  const [best, setBest] = useState(readBest);
  const [newBest, setNewBest] = useState(false);
  const bestRef = useRef(best);
  const shownHits = useRef(0);
  const calloutTurn = useRef(0);
  const statusId = useId();

  const nextCallout = (quality: Quality) => {
    const options = CALLOUTS[quality];
    calloutTurn.current += 1;
    const option = options.at(calloutTurn.current % options.length);
    return option ? i18n._(option) : '';
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useLayoutEffect(() => {
    resize(sim.current, viewW);
    paint(sim.current, refs, 1);
  }, [refs, viewW]);

  const run = () => {
    if (frame.current) return;
    let last: number | undefined;
    let pending = 0;
    const tick = (now: number) => {
      const s = sim.current;
      pending += Math.min(Math.max(0, now - (last ?? now)) * 0.001, MAX_FRAME) * pace(s.hits);
      last = now;
      while (pending >= STEP) {
        step(s);
        pending -= STEP;
      }
      if (s.hits !== shownHits.current) {
        shownHits.current = s.hits;
        const text = nextCallout(s.quality);
        setHits(s.hits);
        setCallout(text);
        flash(s, refs, text);
      }
      if (s.phase === Phase.enum.landing && s.bounced && s.vy === 0) {
        s.phase = Phase.enum.missed;
        s.landedAt = now;
        setPhase(Phase.enum.missed);
        if (s.hits > bestRef.current) {
          bestRef.current = s.hits;
          setBest(s.hits);
          setNewBest(true);
          writeBest(s.hits);
        }
      }
      paint(s, refs, pending * STEPS_PER_SECOND);
      if (isSettled(s)) {
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const swing = (s: Sim) => {
    s.cooldown = SWING_COOLDOWN;
    refs.swing.current?.animate(SWING_KEYFRAMES, SWING_TIMING);
  };

  const serve = (s: Sim) => {
    Object.assign(s, createSim(s.width, s.racketX), {
      racketVx: s.racketVx,
      targetX: s.targetX,
      phase: Phase.enum.playing,
    });
    swing(s);
    launch(s, 0, 1);
    shownHits.current = 0;
    setHits(0);
    setNewBest(false);
    setPhase(Phase.enum.playing);
    run();
  };

  const hit = () => {
    const s = sim.current;
    if (s.phase === Phase.enum.ready) {
      serve(s);
      return;
    }
    if (s.phase === Phase.enum.missed) {
      if (performance.now() - s.landedAt > RESTART_DELAY) serve(s);
      return;
    }
    if (s.cooldown > 0 || s.phase !== Phase.enum.playing) return;
    swing(s);
    s.swingLeft = SWING_WINDOW;
  };

  const aim = (x: number) => {
    sim.current.targetX = clamp(x, RACKET_INSET, sim.current.width - RACKET_INSET);
    run();
  };

  const toSceneX = (clientX: number, clientY: number) => {
    const matrix = refs.svg.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse()).x;
  };

  const onPointerMove = (event: PointerEvent) => {
    const x = toSceneX(event.clientX, event.clientY);
    if (x !== null) aim(x);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const x = toSceneX(event.clientX, event.clientY);
    if (x !== null) {
      aim(x);
      sim.current.racketX = sim.current.targetX;
      sim.current.prevRacketX = sim.current.targetX;
    }
    hit();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      aim(sim.current.targetX + (event.key === 'ArrowLeft' ? -ARROW_STEP : ARROW_STEP));
      return;
    }
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    if (!event.repeat) hit();
  };

  const onClick = (event: MouseEvent) => {
    if (event.detail === 0) hit();
  };

  let status = '';
  if (phase === Phase.enum.missed) {
    status = t`Missed after ${plural(hits, { one: '# hit', other: '# hits' })}. Press Space to serve again.`;
  } else if (hits > 0) {
    status = t`${plural(hits, { one: '# hit', other: '# hits' })}: ${callout}`;
  }

  return (
    <div ref={fieldRef} className={classes.field} data-phase={phase}>
      <button
        type="button"
        className={classes.surface}
        aria-label={t`Keep-it-up game. Move the racket with the arrow keys and press Space or Enter to hit the shuttle when it falls to the racket.`}
        aria-describedby={statusId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        onClick={onClick}
      >
        <Court viewW={viewW} refs={refs} />
      </button>
      <div className={classes.hud} aria-hidden>
        <div className={classes.stat}>
          <span className={classes.statLabel}>
            <Trans>Hits</Trans>
          </span>
          <span key={hits} className={classes.statValue}>
            {hits}
          </span>
        </div>
        <div className={classes.stat} data-align="end">
          <span className={classes.statLabel}>
            <Trans>Best</Trans>
          </span>
          <span className={classes.statValue}>{best}</span>
        </div>
      </div>
      {phase === Phase.enum.ready && (
        <div className={classes.callout} aria-hidden>
          <span className={classes.calloutTitle}>
            <Trans>Tap to serve</Trans>
          </span>
          <span className={classes.calloutHint}>
            <Trans>Get under it and hit it as it drops. Swing on the move to steer.</Trans>
          </span>
          <span className={classes.keys}>
            <Trans>
              or <Kbd size="xs">←</Kbd> <Kbd size="xs">→</Kbd> and <Kbd size="xs">Space</Kbd>
            </Trans>
          </span>
        </div>
      )}
      {phase === Phase.enum.missed && (
        <div className={classes.callout} aria-hidden>
          <span className={classes.calloutTitle}>
            <Trans>Missed!</Trans>
          </span>
          <span className={classes.calloutHint}>
            <Trans>Tap to serve again</Trans>
          </span>
          {newBest && (
            <Badge variant="filled" radius="xl" size="sm">
              <Trans>New best: {best}</Trans>
            </Badge>
          )}
        </div>
      )}
      <VisuallyHidden id={statusId} aria-live="polite">
        {status}
      </VisuallyHidden>
    </div>
  );
};

const StillCourt: FC = () => {
  const { t } = useLingui();
  const { ref, viewW } = useViewWidth();
  return (
    <div ref={ref} className={classes.field}>
      <Court viewW={viewW} label={t`A shuttle resting on a badminton racket`} />
    </div>
  );
};

export const KeepItUp: FC = () => {
  const reduced = useReducedMotion(false, { getInitialValueInEffect: false });
  return (
    <Stack align="center" ta="center" gap="lg" w="100%">
      {reduced ? <StillCourt /> : <KeepItUpGame />}
      <Badge size="lg" variant="light" radius="xl">
        <Trans>404 · Rally on</Trans>
      </Badge>
      <Title order={1} className={classes.title}>
        <Trans>Page not found, but the rally isn't over</Trans>
      </Title>
      <Text size="lg" c="dimmed" maw={520}>
        <Trans>This page is out of play. Keep the shuttle up while you're here, or head back to the club.</Trans>
      </Text>
      <Group justify="center">
        <Button component={Link} to="/" leftSection={<House />} size="md">
          <Trans>Back to the front page</Trans>
        </Button>
        <Button component={Link} to="/trening" variant="default" leftSection={<CalendarBlank />} size="md">
          <Trans>Training times</Trans>
        </Button>
      </Group>
    </Stack>
  );
};

export default KeepItUp;
