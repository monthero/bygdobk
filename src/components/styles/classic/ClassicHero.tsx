import { Trans } from '@lingui/react/macro';
import { Container, Grid, Stack, Text, Title } from '@mantine/core';
import type { FC } from 'react';

import { useSitePhoto } from '~/cms/siteData';
import { NextTraining } from '~/components/training/NextTraining';
import { PhotoSlot } from '~/data/photos';

import { HeroActions } from '../HeroActions';

import classes from './ClassicHero.module.css';

export const ClassicHero: FC = () => {
  const photo = useSitePhoto(PhotoSlot.enum.home);
  return (
    <section className={classes.hero}>
      <div className={classes.photo}>
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="100vw"
          alt={photo.alt}
          className={classes.image}
          style={{ objectPosition: photo.position }}
          fetchPriority="high"
        />
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
