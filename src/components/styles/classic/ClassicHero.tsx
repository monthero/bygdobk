import { Trans, useLingui } from '@lingui/react/macro';
import { Container, Grid, Stack, Text, Title } from '@mantine/core';
import type { FC } from 'react';

import { NextTraining } from '~/components/training/NextTraining';
import { PHOTOS } from '~/data/photos';

import { HeroActions } from '../HeroActions';

import classes from './ClassicHero.module.css';

const HERO_PHOTO = PHOTOS.playerServe;

export const ClassicHero: FC = () => {
  const { i18n } = useLingui();
  return (
    <section className={classes.hero}>
      <div className={classes.photo}>
        <img src={HERO_PHOTO.src} alt={i18n._(HERO_PHOTO.alt)} className={classes.image} fetchPriority="high" />
      </div>
      <Container className={classes.inner}>
        <Grid gap={{ base: 32, md: 48 }} align="center">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="lg" className={classes.copy}>
              <Title order={1} className={classes.title}>
                <Trans>Badminton for everyone at Bygdøhus</Trans>
              </Title>
              <Text size="xl" maw={560}>
                <Trans>
                  From your first swing to a full smash. Beginners, juniors and adults, three evenings a week.
                </Trans>
              </Text>
              <HeroActions />
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <NextTraining frosted />
          </Grid.Col>
        </Grid>
      </Container>
    </section>
  );
};
