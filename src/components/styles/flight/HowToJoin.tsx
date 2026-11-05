import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Blockquote, Button, Container, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { useId, type FC, type ReactNode } from 'react';

import { AddressLink, ArrowRight, MapPin, UserPlus } from '~/components/ui';

import { ShuttleIcon } from './Shuttle';

import classes from './HowToJoin.module.css';

type Step = { call: string; score: string; title: string; body: string; link: ReactNode };

export const HowToJoin: FC = () => {
  const { t } = useLingui();
  const headingId = useId();

  const steps: Step[] = [
    {
      call: t`Serve`,
      score: '1–0',
      title: t`Choose a group`,
      body: t`Beginners, Junior, Adults or a trial. Not sure? Start as a beginner.`,
      link: (
        <Anchor component={Link} to="/trening" className={classes.link}>
          {t`See groups and times`} <ArrowRight className={classes.arrow} />
        </Anchor>
      ),
    },
    {
      call: t`Rally`,
      score: '2–0',
      title: t`Fill in the form`,
      body: t`Parents sign up children under 18.`,
      link: (
        <Anchor component={Link} to="/medlemskap/bli-medlem" className={classes.link}>
          {t`Go to the sign-up form`} <ArrowRight className={classes.arrow} />
        </Anchor>
      ),
    },
    {
      call: t`Point`,
      score: '3–0',
      title: t`Come to training`,
      body: t`Bring indoor shoes.`,
      link: (
        <Text className={classes.place}>
          <MapPin className={classes.pin} />
          <AddressLink />
        </Text>
      ),
    },
  ];

  return (
    <Container component="section" py={56} aria-labelledby={headingId}>
      <Stack gap="xl">
        <Stack gap="xs" maw={640}>
          <Text className={classes.eyebrow}>
            <Trans>Serve · Rally · Point</Trans>
          </Text>
          <Title order={2} id={headingId}>
            <Trans>How to join</Trans>
          </Title>
          <Blockquote cite="— Bygdø Badmintonklubb" radius="md" p="md" mt="xs" className={classes.quote}>
            <Trans>“We want as many people as possible to enjoy playing badminton!”</Trans>
          </Blockquote>
        </Stack>

        <div className={classes.rally}>
          <div className={classes.band} aria-hidden="true">
            <svg viewBox="0 0 100 72" preserveAspectRatio="none" className={classes.arcs}>
              <path
                d="M16.5 72 Q 33.25 -56 50 72 Q 66.75 -56 83.5 72"
                vectorEffect="non-scaling-stroke"
                className={classes.trail}
              />
            </svg>
            <span className={classes.flyer}>
              <ShuttleIcon size={30} />
            </span>
          </div>
          <SimpleGrid
            component="ol"
            cols={{ base: 1, sm: 3 }}
            spacing="lg"
            verticalSpacing={48}
            className={classes.steps}
          >
            {steps.map((step) => (
              <Paper key={step.score} component="li" withBorder radius="lg" p="lg" pt={36} className={classes.step}>
                <span className={classes.score} aria-hidden="true">
                  {step.score}
                </span>
                <Stack gap="xs" align="center" ta="center">
                  <Text className={classes.call}>{step.call}</Text>
                  <Title order={3}>{step.title}</Title>
                  <Text c="dimmed">{step.body}</Text>
                  {step.link}
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </div>

        <Button component={Link} to="/medlemskap/bli-medlem" size="lg" leftSection={<UserPlus />} w="fit-content">
          <Trans>Join the club</Trans>
        </Button>
      </Stack>
    </Container>
  );
};
