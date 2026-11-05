import { Trans, useLingui } from '@lingui/react/macro';
import { Anchor, Button, Container, Stack, Text, ThemeIcon } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import sportModernLogo from '~/assets/sponsors/sport-modern.svg';
import { ArrowRight, Handshake } from '~/components/ui';
import { CLUB } from '~/data/club';

import classes from './SponsorStrip.module.css';

export const SponsorStrip = memo(() => {
  const { t } = useLingui();
  return (
    <aside className={classes.strip} aria-label={t`Partners`}>
      <Container size="lg" className={classes.inner}>
        <a href={CLUB.sportModernUrl} target="_blank" rel="noreferrer" className={classes.logo}>
          <img src={sportModernLogo} alt="Sport Modern" width={227} height={55} />
        </a>
        <Stack gap={2} className={classes.partner}>
          <Text size="xs" fw={700} tt="uppercase" c="dimmed" className={classes.eyebrow}>
            <Trans>Our partner</Trans>
          </Text>
          <Text size="sm">
            <Trans>Members get 20% off at Sport Modern.</Trans>{' '}
            <Anchor component={Link} to="/klubben" hash="medlemsfordel" size="sm" className={classes.more}>
              <Trans>How it works</Trans>
            </Anchor>
          </Text>
        </Stack>
        <div className={classes.sponsor}>
          <ThemeIcon size={44} radius="md" variant="light" className={classes.sponsorIcon}>
            <Handshake />
          </ThemeIcon>
          <div className={classes.sponsorText}>
            <Text fw={700} lh={1.3}>
              <Trans>Want to sponsor the club?</Trans>
            </Text>
            <Text size="sm" c="dimmed" lh={1.35}>
              <Trans>Put your name on local badminton at Bygdøhus.</Trans>
            </Text>
          </div>
          <Button
            component="a"
            href={`mailto:${CLUB.email}`}
            variant="light"
            radius="xl"
            rightSection={<ArrowRight />}
            className={classes.sponsorButton}
          >
            <Trans>Get in touch</Trans>
          </Button>
        </div>
      </Container>
    </aside>
  );
});
