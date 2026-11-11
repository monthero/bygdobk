import { Trans } from '@lingui/react/macro';
import { Anchor, Container, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';
import { z } from 'zod';

import { useSitePhoto } from '~/cms/siteData';
import { PageIntro } from '~/components/styles';
import { ArrowRight } from '~/components/ui';
import { CLUB } from '~/data/club';
import { PhotoSlot } from '~/data/photos';
import { usePageMetaTitle } from '~/hooks/usePageTitle';

import { BoardSection, PrivacySection, SafetySection, SponsorSection } from './sections';

import classes from './ClubPage.module.css';

const ClubSection = z.enum(['styret', 'varsling', 'personvern']);

export const ClubPage: FC = () => {
  usePageMetaTitle('/klubben');
  const photo = useSitePhoto(PhotoSlot.enum.club);
  return (
    <>
      <PageIntro
        photo={photo}
        eyebrow={<Trans>Since {CLUB.founded}</Trans>}
        title={<Trans>About the club</Trans>}
        lede={
          <Trans>
            Bygdø Badmintonklubb is one of Norway’s oldest badminton clubs. We play at Bygdøhus, a private foundation
            where the club rents court time.
          </Trans>
        }
      />
      <Container py={40}>
        <Stack gap={56}>
          <section id={ClubSection.enum.styret} aria-labelledby="styret-title" className={classes.section}>
            <Group justify="space-between" align="baseline" gap="xs" className={classes.title}>
              <Title order={2} id="styret-title">
                <Trans>The board</Trans>
              </Title>
              <Anchor component={Link} to="/kontakt" fw={600} className={classes.more}>
                <Trans>Contact us</Trans> <ArrowRight />
              </Anchor>
            </Group>
            <BoardSection />
          </section>
          <section id={ClubSection.enum.varsling} aria-labelledby="varsling-title" className={classes.section}>
            <Title order={2} id="varsling-title" className={classes.title}>
              <Trans>Safe sport</Trans>
            </Title>
            <SafetySection />
          </section>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <div className={classes.cell}>
              <SponsorSection />
            </div>
            <div id={ClubSection.enum.personvern} className={classes.cell}>
              <PrivacySection />
            </div>
          </SimpleGrid>
        </Stack>
      </Container>
    </>
  );
};
