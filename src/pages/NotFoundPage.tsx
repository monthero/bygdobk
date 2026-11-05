import { Trans } from '@lingui/react/macro';
import { Badge, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { CalendarBlank, ChatCircle, House, UserPlus } from '~/components/ui';

import classes from './NotFoundPage.module.css';

const CourtOut: FC = () => (
  <svg viewBox="0 0 360 220" className={classes.art} aria-hidden>
    <rect x="40" y="30" width="230" height="160" rx="4" className={classes.floor} />
    <g className={classes.lines}>
      <rect x="40" y="30" width="230" height="160" rx="4" />
      <line x1="40" y1="44" x2="270" y2="44" />
      <line x1="40" y1="176" x2="270" y2="176" />
      <line x1="62" y1="30" x2="62" y2="190" />
      <line x1="248" y1="30" x2="248" y2="190" />
      <line x1="122" y1="30" x2="122" y2="190" />
      <line x1="188" y1="30" x2="188" y2="190" />
      <line x1="40" y1="110" x2="122" y2="110" />
      <line x1="188" y1="110" x2="270" y2="110" />
    </g>
    <line x1="155" y1="22" x2="155" y2="198" className={classes.net} />
    <circle cx="155" cy="22" r="4" className={classes.post} />
    <circle cx="155" cy="198" r="4" className={classes.post} />
    <path d="M90 150 C 150 -10, 260 0, 318 172" className={classes.flight} />
    <g className={classes.shuttle}>
      <path d="M0 -12 L-9 -34 L9 -34 Z" className={classes.skirt} />
      <path d="M-3 -13 L-6 -33 M3 -13 L6 -33 M0 -13 L0 -34" className={classes.feathers} />
      <circle cx="0" cy="-8" r="7" className={classes.cork} />
    </g>
    <g transform="translate(318 186)">
      <ellipse cx="0" cy="6" rx="18" ry="4" className={classes.shadow} />
    </g>
    <g className={classes.flag} transform="translate(296 64)">
      <line x1="0" y1="0" x2="0" y2="46" />
      <path d="M0 0 h30 l-6 8 l6 8 h-30 Z" />
    </g>
  </svg>
);

export const NotFoundPage: FC = () => (
  <Container size="md" py={64}>
    <Stack align="center" ta="center" gap="lg">
      <CourtOut />
      <Badge size="lg" variant="light" color="red" radius="xl">
        <Trans>Error 404</Trans>
      </Badge>
      <Title order={1} className={classes.title}>
        <Trans>Out! That one landed past the line</Trans>
      </Title>
      <Text size="lg" c="dimmed" maw={520}>
        <Trans>This page may have moved, or the link has a typo.</Trans>
      </Text>
      <Button component={Link} to="/" leftSection={<House />} size="md">
        <Trans>Back to the front page</Trans>
      </Button>
      <Group justify="center" gap="xs">
        <Button component={Link} to="/trening" variant="default" leftSection={<CalendarBlank />}>
          <Trans>Training</Trans>
        </Button>
        <Button component={Link} to="/medlemskap" variant="default" leftSection={<UserPlus />}>
          <Trans>Membership</Trans>
        </Button>
        <Button component={Link} to="/kontakt" variant="default" leftSection={<ChatCircle />}>
          <Trans>Contact</Trans>
        </Button>
      </Group>
    </Stack>
  </Container>
);
