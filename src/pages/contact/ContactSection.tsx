import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Anchor,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import { AddressLink, CheckCircle, EnvelopeSimple, SocialLinks, VenuePhoto } from '~/components/ui';
import { CLUB } from '~/data/club';
import type { Translate } from '~/i18n/current';

const Topic = z.enum(['training', 'membership', 'tournaments', 'sponsor', 'other']);
type Topic = z.infer<typeof Topic>;

const TOPIC_LABELS: Record<Topic, MessageDescriptor> = {
  [Topic.enum.training]: msg`Training and groups`,
  [Topic.enum.membership]: msg`Membership and payment`,
  [Topic.enum.tournaments]: msg`Events and volunteering`,
  [Topic.enum.sponsor]: msg`Sponsorship`,
  [Topic.enum.other]: msg`Something else`,
};

const SUBMIT_WIDTH = { base: '100%', sm: 'auto' };

const contactSchema = (t: Translate) =>
  z.object({
    topic: Topic,
    name: z
      .string()
      .trim()
      .min(1, t(msg`Enter your name`)),
    email: z.email(t(msg`Enter a valid email address`)),
    message: z
      .string()
      .trim()
      .min(10, t(msg`Write at least a short sentence`)),
  });

export const ContactSection: FC = () => {
  const { t } = useLingui();
  const [sent, setSent] = useState(false);

  const topics = useMemo(() => Topic.options.map((value) => ({ value, label: t(TOPIC_LABELS[value]) })), [t]);
  const schema = useMemo(() => contactSchema(t), [t]);

  const form = useForm({
    initialValues: { topic: Topic.enum.training as Topic, name: '', email: '', message: '' },
    validate: schemaResolver(schema, { sync: true }),
  });

  return (
    <Grid gap={40}>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper withBorder radius="lg" p="xl" h="100%">
          {sent ? (
            <Stack align="center" ta="center" gap="sm" py="lg">
              <CheckCircle width={48} height={48} color="var(--mantine-color-teal-6)" />
              <Title order={2} size="h3">
                <Trans>Thanks, {form.values.name}!</Trans>
              </Title>
              <Text c="dimmed">
                <Trans>In the real site the right person would get your message. This demo did not send it.</Trans>
              </Text>
              <Button
                variant="default"
                onClick={() => {
                  form.reset();
                  setSent(false);
                }}
              >
                <Trans>Write another message</Trans>
              </Button>
            </Stack>
          ) : (
            <form onSubmit={form.onSubmit(() => setSent(true))} noValidate>
              <Stack gap="md">
                <Select
                  label={t`What is it about?`}
                  data={topics}
                  allowDeselect={false}
                  {...form.getInputProps('topic')}
                />
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput label={t`Name`} autoComplete="name" withAsterisk {...form.getInputProps('name')} />
                  <TextInput
                    label={t`Email`}
                    type="email"
                    autoComplete="email"
                    withAsterisk
                    {...form.getInputProps('email')}
                  />
                </SimpleGrid>
                <Textarea label={t`Message`} autosize minRows={4} withAsterisk {...form.getInputProps('message')} />
                <Group justify="flex-end">
                  <Button type="submit" leftSection={<EnvelopeSimple />} w={SUBMIT_WIDTH}>
                    <Trans>Send message</Trans>
                  </Button>
                </Group>
              </Stack>
            </form>
          )}
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, md: 5 }}>
        <Card withBorder radius="lg" padding="lg" h="100%">
          <VenuePhoto fill />
          <Stack gap={6}>
            <Text fw={700}>{CLUB.name}</Text>
            <Text>
              <AddressLink />
            </Text>
            <Anchor href={`mailto:${CLUB.email}`}>{CLUB.email}</Anchor>
            <Text size="sm" c="dimmed">
              <Trans>Org. no. {CLUB.orgNr}</Trans>
            </Text>
            <SocialLinks />
          </Stack>
        </Card>
      </Grid.Col>
    </Grid>
  );
};
