import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import {
  Alert,
  Anchor,
  Avatar,
  Button,
  Card,
  Grid,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
  VisuallyHidden,
} from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { z } from 'zod';

import { AVATAR_IMAGE_PROPS, useUser } from '~/components/auth';
import {
  AddressLink,
  ArrowCounterClockwise,
  CheckCircle,
  EnvelopeSimple,
  SocialLinks,
  VenuePhoto,
  Warning,
} from '~/components/ui';
import { CLUB } from '~/data/club';
import {
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_NAME_MAX,
  CONTACT_TOPIC_LABELS,
  ContactTopic,
} from '~/data/contact';
import type { Translate } from '~/i18n/current';
import type { User } from '~/stores/auth';
import { supabase } from '~/supabase/client';

const SUBMIT_WIDTH = { base: '100%', sm: 'auto' };

const contactSchemas = (t: Translate) => {
  const message = z.object({
    topic: ContactTopic,
    message: z
      .string()
      .trim()
      .min(CONTACT_MESSAGE_MIN, t(msg`Write at least a short sentence`)),
  });
  const withSender = message.extend({
    name: z
      .string()
      .trim()
      .min(1, t(msg`Enter your name`)),
    email: z.email(t(msg`Enter a valid email address`)),
  });
  return { message, withSender };
};

type ContactValues = { topic: ContactTopic; name: string; email: string; message: string; website: string };

type ContactEmail = Omit<ContactValues, 'topic'> & {
  subject: string;
  topic: string;
  labels: { topic: string; name: string; email: string };
};

const sendMessage = async (body: ContactEmail) => {
  const { error } = await supabase.functions.invoke('contact', { body });
  if (error) throw error;
};

const SENDER_BG = 'var(--bk-surface-2)';
const SENDER_FLEX = '1 1 14rem';

const SenderRow: FC<{ user: User; onChange: () => void }> = ({ user, onChange }) => (
  <Paper withBorder radius="md" p="sm" bg={SENDER_BG}>
    <Group justify="space-between" gap="xs">
      <Group gap="sm" wrap="nowrap" miw={0} flex={SENDER_FLEX}>
        <Avatar src={user.avatarUrl} name={user.name} color="initials" imageProps={AVATAR_IMAGE_PROPS} />
        <Stack gap={0} miw={0}>
          <Text size="xs" c="dimmed">
            <Trans>Sending as</Trans>
          </Text>
          <Text fw={600} truncate>
            {user.name}
          </Text>
          <Text size="sm" c="dimmed" truncate>
            {user.email}
          </Text>
        </Stack>
      </Group>
      <Button size="xs" variant="default" onClick={onChange}>
        <Trans>Use other details</Trans>
      </Button>
    </Group>
  </Paper>
);

const SenderSkeleton: FC = () => (
  <Paper withBorder radius="md" p="sm" bg={SENDER_BG} aria-busy>
    <Group gap="sm" wrap="nowrap" flex={1}>
      <Skeleton circle height={38} />
      <Stack gap={6} flex={1}>
        <Skeleton height={10} width="30%" />
        <Skeleton height={12} width="55%" />
      </Stack>
    </Group>
  </Paper>
);

const Sent: FC<{ name: string; onAgain: () => void }> = ({ name, onAgain }) => (
  <Stack align="center" ta="center" gap="sm" py="lg">
    <CheckCircle width={48} height={48} color="var(--mantine-color-teal-6)" />
    <Title order={2} size="h3">
      <Trans>Thanks, {name}!</Trans>
    </Title>
    <Text c="dimmed">
      <Trans>Your message is on its way to the board.</Trans>
    </Text>
    <Button variant="default" onClick={onAgain}>
      <Trans>Write another message</Trans>
    </Button>
  </Stack>
);

export const ContactSection: FC<{ initialTopic?: ContactTopic; draft?: string }> = ({ initialTopic, draft }) => {
  const { t } = useLingui();
  const { user, loading } = useUser();
  const [otherDetails, setOtherDetails] = useState(false);
  const sendingAs = otherDetails ? null : user;
  const messageRef = useRef<HTMLTextAreaElement>(null);

  const topics = useMemo(
    () => ContactTopic.options.map((value) => ({ value, label: t(CONTACT_TOPIC_LABELS[value]) })),
    [t],
  );
  const schemas = useMemo(() => contactSchemas(t), [t]);

  const form = useForm<ContactValues>({
    initialValues: {
      topic: initialTopic ?? ContactTopic.enum.training,
      name: '',
      email: '',
      message: draft ?? '',
      website: '',
    },
    validate: schemaResolver(sendingAs ? schemas.message : schemas.withSender, { sync: true }),
  });
  const send = useMutation({ mutationFn: sendMessage });

  useEffect(() => {
    const field = messageRef.current;
    if (!field || !(initialTopic || draft)) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, [initialTopic, draft]);

  const submit = form.onSubmit((values) => {
    if (loading) return;
    const { name, email } = sendingAs ?? values;
    const topic = t(CONTACT_TOPIC_LABELS[values.topic]);
    send.mutate({
      name,
      email,
      message: values.message,
      website: values.website,
      topic,
      subject: t`Contact form: ${topic} (from ${name})`,
      labels: { topic: t`Topic`, name: t`Name`, email: t`Email` },
    });
  });

  const showOtherDetails = () => {
    if (user) form.setValues({ name: user.name, email: user.email });
    setOtherDetails(true);
  };

  let sender = (
    <SimpleGrid cols={{ base: 1, sm: 2 }}>
      <TextInput
        label={t`Name`}
        autoComplete="name"
        maxLength={CONTACT_NAME_MAX}
        withAsterisk
        {...form.getInputProps('name')}
      />
      <TextInput
        label={t`Email`}
        type="email"
        autoComplete="email"
        maxLength={CONTACT_EMAIL_MAX}
        withAsterisk
        {...form.getInputProps('email')}
      />
    </SimpleGrid>
  );
  if (loading) sender = <SenderSkeleton />;
  else if (sendingAs) sender = <SenderRow user={sendingAs} onChange={showOtherDetails} />;

  return (
    <Grid gap={40}>
      <Grid.Col span={{ base: 12, md: 7 }}>
        <Paper withBorder radius="lg" p="xl" h="100%">
          {send.isSuccess ? (
            <Sent
              name={send.variables.name}
              onAgain={() => {
                form.reset();
                form.setFieldValue('message', '');
                send.reset();
              }}
            />
          ) : (
            <form onSubmit={submit} noValidate>
              <Stack gap="md">
                <Select
                  label={t`What is it about?`}
                  data={topics}
                  allowDeselect={false}
                  {...form.getInputProps('topic')}
                />
                {sender}
                <Textarea
                  ref={messageRef}
                  label={t`Message`}
                  autosize
                  minRows={4}
                  maxLength={CONTACT_MESSAGE_MAX}
                  withAsterisk
                  {...form.getInputProps('message')}
                />
                <VisuallyHidden aria-hidden>
                  <TextInput
                    label={t`Leave this empty`}
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    {...form.getInputProps('website')}
                  />
                </VisuallyHidden>
                {send.isError && (
                  <Alert color="red" variant="light" icon={<Warning />} title={t`That didn't go through`}>
                    <Stack gap="xs" align="flex-start">
                      <Text size="sm">
                        <Trans>
                          Try again, or email us at <Anchor href={`mailto:${CLUB.email}`}>{CLUB.email}</Anchor>.
                        </Trans>
                      </Text>
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<ArrowCounterClockwise />}
                        onClick={() => submit()}
                      >
                        <Trans>Try again</Trans>
                      </Button>
                    </Stack>
                  </Alert>
                )}
                <Group justify="flex-end">
                  <Button
                    type="submit"
                    leftSection={<EnvelopeSimple />}
                    w={SUBMIT_WIDTH}
                    loading={send.isPending}
                    disabled={loading}
                  >
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
