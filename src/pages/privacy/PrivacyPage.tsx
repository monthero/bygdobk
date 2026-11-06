import { Trans } from '@lingui/react/macro';
import { Button, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import { usePrivacyPage } from '~/cms/content';
import { ArticleBody } from '~/components/news';
import { PageIntro } from '~/components/styles';
import { ArrowRight, ShieldCheck } from '~/components/ui';
import { contactLink, ContactTopic } from '~/data/contact';
import { PHOTOS } from '~/data/photos';
import { date, formatDate, LONG_DATE } from '~/utils/dates';

import classes from './PrivacyPage.module.css';

const CONTACT = contactLink(ContactTopic.enum.other);

const ContactButton: FC = () => (
  <Button
    renderRoot={(props) => <Link {...props} {...CONTACT} />}
    variant="light"
    radius="xl"
    rightSection={<ArrowRight />}
    w="fit-content"
  >
    <Trans>Write to the board</Trans>
  </Button>
);

const NotWritten: FC = () => (
  <>
    <PageIntro photo={PHOTOS.privacyPhone} title={<Trans>Privacy</Trans>} />
    <Container py={{ base: 28, md: 40 }}>
      <Stack align="center" ta="center" gap="md" py={24}>
        <ThemeIcon size={64} radius="xl" variant="light">
          <ShieldCheck width={32} height={32} />
        </ThemeIcon>
        <Title order={2}>
          <Trans>The board is still writing this page</Trans>
        </Title>
        <Text c="dimmed" maw={460}>
          <Trans>Questions about your data? Ask the board, and we’ll answer.</Trans>
        </Text>
        <ContactButton />
      </Stack>
    </Container>
  </>
);

export const PrivacyPage: FC = () => {
  const page = usePrivacyPage();
  if (!page) return <NotWritten />;

  const updated = page.updatedAt && formatDate(date(page.updatedAt), LONG_DATE);
  return (
    <>
      <PageIntro
        photo={PHOTOS.privacyPhone}
        title={page.title}
        lede={updated && <Trans>Last updated {updated}</Trans>}
      />
      <Container py={{ base: 28, md: 40 }}>
        <Stack gap={36} className={classes.column}>
          <article>
            <ArticleBody blocks={page.body} />
          </article>
          <ContactButton />
        </Stack>
      </Container>
    </>
  );
};
