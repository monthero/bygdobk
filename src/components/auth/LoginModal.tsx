import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Badge, Button, Divider, Group, Stack, Text, TextInput, ThemeIcon } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { memo, useEffect, useMemo, useState, type FC, type ReactNode } from 'react';
import { z } from 'zod';

import {
  Check,
  EnvelopeSimple,
  GoogleLogo,
  PaperPlaneTilt,
  ResponsiveModal,
  Warning,
  WindowsLogo,
} from '~/components/ui';
import type { Translate } from '~/i18n/current';
import { startAuth, useAuth } from '~/stores/auth';
import { useUi } from '~/stores/ui';
import { getSupabase } from '~/supabase/client';

import { authErrorMessage, LOGIN_FAILED } from './errors';
import { OAuthProvider, useAuthSettings } from './hooks';

const loginSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t(msg`Enter a valid email address`))),
  });

const SENT_ICON = <EnvelopeSimple width={28} height={28} />;

const sendLink = async (email: string) => {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.href } });
  if (error) throw error;
};

type ProviderInfo = { label: MessageDescriptor; off: MessageDescriptor; icon: ReactNode; scopes?: string };

const PROVIDERS: Record<OAuthProvider, ProviderInfo> = {
  [OAuthProvider.enum.google]: {
    label: msg`Continue with Google`,
    off: msg`Google login isn't switched on yet.`,
    icon: <GoogleLogo />,
  },
  [OAuthProvider.enum.azure]: {
    label: msg`Continue with Microsoft`,
    off: msg`Microsoft login isn't switched on yet.`,
    icon: <WindowsLogo />,
    scopes: 'email',
  },
};

const continueWith = async (provider: OAuthProvider) => {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.href, scopes: PROVIDERS[provider].scopes },
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
  const { i18n, t } = useLingui();
  const linkError = useAuth((s) => s.linkError);
  const settings = useAuthSettings();
  const [sent, setSent] = useState<Sent | null>(null);

  const schema = useMemo(() => loginSchema(t), [t]);

  const form = useForm({
    mode: 'controlled',
    initialValues: { email: '' },
    validate: schemaResolver(schema, { sync: true }),
  });

  const oauth = useMutation({ mutationFn: continueWith });
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

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        <Trans>No password needed.</Trans>
      </Text>
      {linkError && <ErrorAlert error={linkError} fallback={LOGIN_FAILED} />}
      <Stack gap={6}>
        {OAuthProvider.options.map((provider) => {
          const off = settings.data?.external[provider] === false;
          const busy = oauth.variables === provider && (oauth.isPending || oauth.isSuccess);
          return (
            <Stack key={provider} gap={6}>
              <Button
                variant="default"
                leftSection={PROVIDERS[provider].icon}
                loading={settings.isPending || busy}
                disabled={off || (oauth.isPending && !busy)}
                onClick={() => oauth.mutate(provider)}
              >
                {i18n._(PROVIDERS[provider].label)}
              </Button>
              {off && (
                <Text size="xs" c="dimmed" ta="center">
                  {i18n._(PROVIDERS[provider].off)}
                </Text>
              )}
            </Stack>
          );
        })}
        {oauth.isError && <ErrorAlert error={oauth.error} />}
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
  useEffect(() => void startAuth(), []);
  const opened = useUi((s) => s.loginOpened);

  return (
    <ResponsiveModal opened={opened} onClose={close} title={t`Log in`}>
      <LoginForm />
    </ResponsiveModal>
  );
});

export default LoginModal;
