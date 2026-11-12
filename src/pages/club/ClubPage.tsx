import { Trans } from '@lingui/react/macro';
import { Container, SimpleGrid, Stack, Title } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import type { FC } from 'react';
import { z } from 'zod';

import { useSitePhoto } from '~/cms/siteData';
import { PageIntro } from '~/components/styles';
import { CLUB } from '~/data/club';
import { CONTACT_HASH } from '~/data/contact';
import { PhotoSlot } from '~/data/photos';
import { usePageMetaTitle } from '~/hooks/usePageTitle';
import { ContactSection } from '~/pages/contact/ContactSection';

import { BoardSection, PrivacySection, SafetySection, SponsorSection } from './sections';

import classes from './ClubPage.module.css';

const ClubSection = z.enum([CONTACT_HASH, 'styret', 'varsling', 'personvern']);

const route = getRouteApi('/klubben/');

export const ClubPage: FC = () => {
  usePageMetaTitle('/klubben');
  const photo = useSitePhoto(PhotoSlot.enum.club);
  const { emne, melding } = route.useSearch();
  return (
    <>
      <PageIntro
        photo={photo}
        eyebrow={<Trans>Since {CLUB.founded}</Trans>}
        title={<Trans>About the club</Trans>}
        lede={
          <Trans>
            Bygdø Badmintonklubb is one of Norway’s oldest badminton clubs. We play at Bygdøhus, a private foundation
            where the club rents court time. Questions? Write to the board below.
          </Trans>
        }
      />
      <Container py={40}>
        <Stack gap={56}>
          <section id={ClubSection.enum.kontakt} aria-labelledby="kontakt-title" className={classes.section}>
            <Title order={2} id="kontakt-title" className={classes.title}>
              <Trans>Contact us</Trans>
            </Title>
            <ContactSection key={`${emne}:${melding}`} initialTopic={emne} draft={melding} />
          </section>
          <section id={ClubSection.enum.styret} aria-labelledby="styret-title" className={classes.section}>
            <Title order={2} id="styret-title" className={classes.title}>
              <Trans>The board</Trans>
            </Title>
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
