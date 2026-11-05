import { Trans } from '@lingui/react/macro';
import { Container } from '@mantine/core';
import type { FC } from 'react';

import { PageIntro } from '~/components/styles';
import { PHOTOS } from '~/data/photos';

import { ContactSection } from './ContactSection';

export const ContactPage: FC = () => (
  <>
    <PageIntro
      photo={PHOTOS.bygdohusCourts}
      title={<Trans>Contact us</Trans>}
      lede={
        <Trans>
          A question about training, membership or something else? Pick a topic and your message goes to the right
          person.
        </Trans>
      }
    />
    <Container py={40}>
      <ContactSection />
    </Container>
  </>
);
