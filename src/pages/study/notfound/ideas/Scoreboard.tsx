import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Group, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { Link } from '@tanstack/react-router';
import { memo, useCallback, useEffect, useState, type CSSProperties, type FC } from 'react';
import { z } from 'zod';

import { CalendarBlank, Eye, House } from '~/components/ui';

import classes from './Scoreboard.module.css';

const Segment = z.enum(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
type Segment = z.infer<typeof Segment>;

const Phase = z.enum(['rally', 'fault', 'review', 'upheld']);
type Phase = z.infer<typeof Phase>;

const SEG_WIDTH = 10;
const SEG_GAP = 1.6;
const LEFT = 5;
const RIGHT = 55;
const TOP = 5;
const MIDDLE = 52;
const BOTTOM = 99;
const HALF = SEG_WIDTH * 0.5;

const horizontal = (y: number, x0: number, x1: number) =>
  `${x0},${y} ${x0 + HALF},${y - HALF} ${x1 - HALF},${y - HALF} ${x1},${y} ${x1 - HALF},${y + HALF} ${x0 + HALF},${y + HALF}`;

const vertical = (x: number, y0: number, y1: number) =>
  `${x},${y0} ${x + HALF},${y0 + HALF} ${x + HALF},${y1 - HALF} ${x},${y1} ${x - HALF},${y1 - HALF} ${x - HALF},${y0 + HALF}`;

const SEGMENT_POINTS: Record<Segment, string> = {
  [Segment.enum.a]: horizontal(TOP, LEFT + SEG_GAP, RIGHT - SEG_GAP),
  [Segment.enum.b]: vertical(RIGHT, TOP + SEG_GAP, MIDDLE - SEG_GAP),
  [Segment.enum.c]: vertical(RIGHT, MIDDLE + SEG_GAP, BOTTOM - SEG_GAP),
  [Segment.enum.d]: horizontal(BOTTOM, LEFT + SEG_GAP, RIGHT - SEG_GAP),
  [Segment.enum.e]: vertical(LEFT, MIDDLE + SEG_GAP, BOTTOM - SEG_GAP),
  [Segment.enum.f]: vertical(LEFT, TOP + SEG_GAP, MIDDLE - SEG_GAP),
  [Segment.enum.g]: horizontal(MIDDLE, LEFT + SEG_GAP, RIGHT - SEG_GAP),
};

const SEGMENT_LIST = z.array(Segment);
const DIGITS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'].map(
  (code) => new Set(SEGMENT_LIST.parse(Array.from(code))),
);
const BLANK = new Set<Segment>();

const RALLY: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [2, 1],
  [3, 1],
  [3, 2],
  [4, 2],
  [4, 3],
  [4, 4],
];
const FINAL = RALLY.length - 1;
const RALLY_START_MS = 500;
const RALLY_STEP_MS = 360;
const REVIEW_MS = 2200;

const Digit: FC<{ value?: number }> = memo(({ value }) => {
  const lit = value === undefined ? BLANK : (DIGITS[value] ?? BLANK);
  return (
    <svg viewBox="0 0 60 104" className={classes.digit} aria-hidden>
      {Segment.options.map((segment) => (
        <polygon
          key={segment}
          points={SEGMENT_POINTS[segment]}
          className={classes.segment}
          data-on={lit.has(segment) || undefined}
        />
      ))}
    </svg>
  );
});

const ServeLed: FC = () => (
  <svg viewBox="0 0 24 24" className={classes.serve} aria-hidden>
    <path d="M4 7 L14 3 L14 21 L4 17 Z" />
    <circle cx="17.5" cy="12" r="4.5" />
  </svg>
);

const CallLine: FC<{ text: string; phase: Phase }> = ({ text, phase }) => (
  <p className={classes.call} aria-live="polite">
    <span className={classes.callLabel}>
      <Trans>Umpire</Trans>
    </span>
    <span className={classes.callText} key={text} data-phase={phase} aria-hidden>
      {Array.from(text, (char, index) => (
        <span key={index} style={{ '--i': index } as CSSProperties}>
          {char}
        </span>
      ))}
    </span>
    <VisuallyHidden>{text}</VisuallyHidden>
  </p>
);

export const Scoreboard: FC = () => {
  const { t } = useLingui();
  const reduced = useReducedMotion(false, { getInitialValueInEffect: false });
  const [rallyStep, setStep] = useState(reduced ? FINAL : 0);
  const [phaseState, setPhase] = useState<Phase>(reduced ? Phase.enum.fault : Phase.enum.rally);
  const step = reduced ? FINAL : rallyStep;
  const phase = reduced && phaseState === Phase.enum.rally ? Phase.enum.fault : phaseState;

  useEffect(() => {
    if (phase !== Phase.enum.rally) return;
    const timer = setTimeout(
      () => {
        if (step >= FINAL) {
          setPhase(Phase.enum.fault);
          return;
        }
        setStep(step + 1);
      },
      step === 0 ? RALLY_START_MS : RALLY_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [step, phase]);

  useEffect(() => {
    if (phase !== Phase.enum.review) return;
    const timer = setTimeout(() => setPhase(Phase.enum.upheld), reduced ? 0 : REVIEW_MS);
    return () => clearTimeout(timer);
  }, [phase, reduced]);

  const challenge = useCallback(() => setPhase(Phase.enum.review), []);

  const [home, away] = RALLY[step] ?? [0, 0];
  const calls: Record<Phase, string> = {
    [Phase.enum.rally]: t`Rally in progress`,
    [Phase.enum.fault]: t`Service fault: page not found`,
    [Phase.enum.review]: t`Challenge. Checking the replay…`,
    [Phase.enum.upheld]: t`Call stands: still not found`,
  };
  const faultOn = phase !== Phase.enum.rally;
  const challengeLabels: Record<Phase, string> = {
    [Phase.enum.rally]: t`Challenge the call`,
    [Phase.enum.fault]: t`Challenge the call`,
    [Phase.enum.review]: t`Reviewing…`,
    [Phase.enum.upheld]: t`No challenges left`,
  };

  return (
    <Stack align="center" ta="center" gap="lg" w="100%" maw={720} mx="auto">
      <div className={classes.mount}>
        <section className={classes.board} data-phase={phase} aria-label={t`Hall scoreboard`}>
          <header className={classes.top}>
            <span className={classes.court}>
              <Trans>Court 1</Trans>
            </span>
            <span className={classes.clock} aria-hidden>
              00:04:04
            </span>
            <span className={classes.lamp} data-on={faultOn || undefined}>
              <Trans>Fault</Trans>
            </span>
          </header>

          <VisuallyHidden>{t`Score: Bygdø ${home}, 404 ${away}`}</VisuallyHidden>
          <div className={classes.scores} aria-hidden>
            <div className={classes.team}>
              <span className={classes.name} data-team="home">
                BYGDØ
              </span>
              <div className={classes.digits}>
                <Digit />
                <Digit key={home} value={home} />
              </div>
            </div>
            <div className={classes.colon}>
              <i />
              <i />
            </div>
            <div className={classes.team}>
              <span className={classes.name} data-team="away">
                <ServeLed />
                404
              </span>
              <div className={classes.digits}>
                <Digit value={0} />
                <Digit key={away} value={away} />
              </div>
            </div>
          </div>

          <CallLine text={calls[phase]} phase={phase} />
          <span className={classes.scan} aria-hidden />
        </section>
      </div>

      <Button
        variant="light"
        size="compact-sm"
        color="gray"
        radius="xl"
        leftSection={<Eye />}
        className={classes.challenge}
        onClick={challenge}
        disabled={phase !== Phase.enum.fault}
      >
        {challengeLabels[phase]}
      </Button>

      <Badge size="lg" variant="light" color="red" radius="xl">
        <Trans>404 · Service fault</Trans>
      </Badge>
      <Title order={1} className={classes.title}>
        <Trans>Fault!</Trans>
      </Title>
      <Text size="lg" c="dimmed" maw={520}>
        <Trans>
          The umpire looked twice. This page is not on the court. It may have moved, or the link has a typo.
        </Trans>
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
