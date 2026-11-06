import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Badge, Button, Divider, Group, Modal, Stack, Text, TextInput, ThemeIcon } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { memo, useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import { BottomSheet, Check, EnvelopeSimple, GoogleLogo, PaperPlaneTilt, Warning } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Translate } from '~/i18n/current';
import { useAuth } from '~/stores/auth';
import { useUi } from '~/stores/ui';
import { supabase } from '~/supabase/client';

import { authErrorMessage, LOGIN_FAILED } from './errors';
import { useAuthSettings } from './hooks';

const loginSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t(msg`Enter a valid email address`))),
  });

const SENT_ICON = <EnvelopeSimple width={28} height={28} />;

const sendLink = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
  if (error) throw error;
};

const continueWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
  if (error) throw error;
};

const close = () => {
  useUi.getState().closeLogin();
  useAuth.setState({ linkError: null });
};

const ErrorAlert: FC<{ error: unknown; fallback?: MessageDescriptor }> = ({ error, fallback }) => {
  const { i18n } = useLingui();
  return (
    <Alert color="red" variant="light" icon={<Warning />} ta="start">
      {i18n._(authErrorMessage(error, fallback))}
    </Alert>
  );
};

type Sent = { email: string; count: number };

type LinkSentProps = { sent: Sent; error: unknown; resending: boolean; onResend: () => void; onBack: () => void };

const LinkSent: FC<LinkSentProps> = ({ sent, error, resending, onResend, onBack }) => {
  const { email, count } = sent;
  return (
    <Stack gap="md" align="center" ta="center" py="sm">
      <ThemeIcon size={56} radius="xl" variant="light">
        {SENT_ICON}
      </ThemeIcon>
      <Stack gap={4}>
        <Text fw={700} size="lg">
          <Trans>Check your email</Trans>
        </Text>
        <Text>
          <Trans>
            We sent a login link to <strong>{email}</strong>. Open it in this browser.
          </Trans>
        </Text>
      </Stack>
      {count > 1 && !resending && (
        <Badge color="teal" variant="light" leftSection={<Check />}>
          <Trans>New link sent</Trans>
        </Badge>
      )}
      {error !== null && <ErrorAlert error={error} />}
      <Group justify="center" gap="xs">
        <Button variant="default" onClick={onBack}>
          <Trans>Use another email</Trans>
        </Button>
        <Button variant="subtle" loading={resending} onClick={onResend}>
          <Trans>Send again</Trans>
        </Button>
      </Group>
    </Stack>
  );
};

const LoginForm: FC = () => {
  const { t } = useLingui();
  const linkError = useAuth((s) => s.linkError);
  const settings = useAuthSettings();
  const [sent, setSent] = useState<Sent | null>(null);

  const schema = useMemo(() => loginSchema(t), [t]);

  const form = useForm({
    mode: 'controlled',
    initialValues: { email: '' },
    validate: schemaResolver(schema, { sync: true }),
  });

  const google = useMutation({ mutationFn: continueWithGoogle });
  const link = useMutation({
    mutationFn: sendLink,
    onMutate: () => useAuth.setState({ linkError: null }),
    onSuccess: (_data, email) => setSent((prev) => ({ email, count: prev?.email === email ? prev.count + 1 : 1 })),
  });

  if (sent) {
    return (
      <LinkSent
        sent={sent}
        error={link.error}
        resending={link.isPending}
        onResend={() => link.mutate(sent.email)}
        onBack={() => {
          link.reset();
          setSent(null);
        }}
      />
    );
  }

  const googleOff = settings.data?.external.google === false;

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        <Trans>No password needed.</Trans>
      </Text>
      {linkError && <ErrorAlert error={linkError} fallback={LOGIN_FAILED} />}
      <Stack gap={6}>
        <Button
          variant="default"
          leftSection={<GoogleLogo />}
          loading={settings.isPending || google.isPending || google.isSuccess}
          disabled={googleOff}
          onClick={() => google.mutate()}
        >
          <Trans>Continue with Google</Trans>
        </Button>
        {googleOff && (
          <Text size="xs" c="dimmed" ta="center">
            <Trans>Google login isn't switched on yet.</Trans>
          </Text>
        )}
        {google.isError && <ErrorAlert error={google.error} />}
      </Stack>
      <Divider label={t`or get a link by email`} />
      <form onSubmit={form.onSubmit(({ email }) => link.mutate(email.trim()))} noValidate>
        <Stack gap="sm">
          <TextInput
            label={t`Email`}
            type="email"
            autoComplete="email"
            data-autofocus
            {...form.getInputProps('email')}
          />
          {link.isError && <ErrorAlert error={link.error} />}
          <Button type="submit" leftSection={<PaperPlaneTilt />} loading={link.isPending}>
            <Trans>Send me a link</Trans>
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};

export const LoginModal = memo(() => {
  const { t } = useLingui();
  const opened = useUi((s) => s.loginOpened);
  const mobile = useIsMobile();

  if (mobile) {
    return (
      <BottomSheet opened={opened} onClose={close} handle>
        <Stack gap="md" p="lg" pt="sm" pb="calc(20px + env(safe-area-inset-bottom))">
          <Text fw={600} size="lg">
            {t`Log in`}
          </Text>
          <LoginForm />
        </Stack>
      </BottomSheet>
    );
  }

  return (
    <Modal opened={opened} onClose={close} title={t`Log in`} centered>
      <LoginForm />
    </Modal>
  );
});
