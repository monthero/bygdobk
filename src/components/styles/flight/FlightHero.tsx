import { Trans } from '@lingui/react/macro';
import { Box, Container, Grid, Stack, Text, Title } from '@mantine/core';
import { useId, useLayoutEffect, useRef, useState, type FC } from 'react';

import { NextTraining } from '~/components/training/NextTraining';

import { HeroActions } from '../HeroActions';
import { Shuttle } from './Shuttle';

import classes from './FlightHero.module.css';

type Point = { x: number; y: number };
type Arc = { width: number; height: number; end: Point; d: string };
type Curve = { start: Point; c1: Point; c2: Point };

const LANDING_INSET = 30;
const LOW_DROP = 24;
const LOW_RISE = 60;
const NON_ID_CHARS = /[^\w-]/g;

const round = (n: number) => Math.round(n * 10) * 0.1;

const highArc = (width: number, end: Point): Curve => ({
  start: { x: width + 40, y: end.y * 0.55 },
  c1: { x: width * 0.74, y: -end.y * 0.32 },
  c2: { x: end.x + (width - end.x) * 0.22, y: -end.y * 0.12 },
});

const lowArc = (width: number, end: Point): Curve => ({
  start: { x: width + 40, y: end.y + LOW_DROP },
  c1: { x: width * 0.8, y: end.y - LOW_RISE },
  c2: { x: end.x + 48, y: end.y - LOW_RISE },
});

const arcFor = (width: number, height: number, end: Point, low: boolean): Arc => {
  const { start, c1, c2 } = low ? lowArc(width, end) : highArc(width, end);
  const d = [
    `M${round(start.x)} ${round(start.y)}`,
    `C${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(end.x)} ${round(end.y)}`,
  ].join(' ');
  return { width: round(width), height: round(height), end, d };
};

export const FlightHero: FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const joinRef = useRef<HTMLAnchorElement>(null);
  const [arc, setArc] = useState<Arc | null>(null);
  const maskId = `flight-${useId().replace(NON_ID_CHARS, '')}`;

  useLayoutEffect(() => {
    const hero = heroRef.current;
    const join = joinRef.current;
    if (!hero || !join) return;
    const update = () => {
      const box = hero.getBoundingClientRect();
      const button = join.getBoundingClientRect();
      const neighbor = join.nextElementSibling?.getBoundingClientRect();
      const aloneInRow = !neighbor || neighbor.top >= button.bottom;
      const next = arcFor(
        box.width,
        box.height,
        { x: button.right - box.left - LANDING_INSET, y: button.top - box.top },
        aloneInRow,
      );
      setArc((prev) => (prev?.d === next.d ? prev : next));
    };
    const observer = new ResizeObserver(update);
    observer.observe(hero);
    observer.observe(join);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={heroRef} className={classes.hero}>
      {arc && (
        <svg
          className={classes.art}
          viewBox={`0 0 ${arc.width} ${arc.height}`}
          width={arc.width}
          height={arc.height}
          aria-hidden="true"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={arc.width} height={arc.height}>
              <path d={arc.d} pathLength={1} className={classes.reveal} />
            </mask>
          </defs>
          <path d={arc.d} className={classes.trail} mask={`url(#${maskId})`} />
          <ellipse cx={arc.end.x} cy={arc.end.y + 2} rx="16" ry="3.5" className={classes.landing} />
          <Shuttle className={classes.flyer} style={{ offsetPath: `path('${arc.d}')` }} />
        </svg>
      )}
      <Container className={classes.inner}>
        <Grid gap={{ base: 32, md: 48 }} align="center">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="lg">
              <Title order={1} className={`${classes.title} ${classes.halo}`}>
                <Trans>Badminton for everyone at Bygdøhus</Trans>
              </Title>
              <Text size="xl" maw={560} className={classes.halo}>
                <Trans>
                  From your first swing to a full smash. Beginners, juniors and adults, three evenings a week.
                </Trans>
              </Text>
              <Box mt={36}>
                <HeroActions joinRef={joinRef} joinClassName={classes.join} textClassName={classes.halo} />
              </Box>
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <NextTraining />
          </Grid.Col>
        </Grid>
      </Container>
    </section>
  );
};
