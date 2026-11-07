import { Trans, useLingui } from '@lingui/react/macro';
import { Container } from '@mantine/core';
import { getRouteApi } from '@tanstack/react-router';
import type { FC } from 'react';

import { useSitePhoto } from '~/cms/siteData';
import { PageIntro } from '~/components/styles';
import { PhotoSlot } from '~/data/photos';
import { usePageTitle } from '~/hooks/usePageTitle';

import { ContactSection } from './ContactSection';

const route = getRouteApi('/kontakt');

export const ContactPage: FC = () => {
  const { t } = useLingui();
  usePageTitle(t`Contact`);
  const photo = useSitePhoto(PhotoSlot.enum.contact);
  const { emne, melding } = route.useSearch();
  return (
    <>
      <PageIntro
        photo={photo}
        title={<Trans>Contact us</Trans>}
        lede={
          <Trans>
            A question about training, membership or something else? Pick a topic and your message goes to the board.
          </Trans>
        }
      />
      <Container py={40}>
        <ContactSection key={`${emne}:${melding}`} initialTopic={emne} draft={melding} />
      </Container>
    </>
  );
};
