import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Divider, Modal, PasswordInput, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { memo, useMemo, type FC } from 'react';
import { z } from 'zod';

import { BottomSheet, Info, SignIn } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { Translate } from '~/i18n/current';
import { DEMO_USERS, Role, useAuth, type User } from '~/stores/auth';
import { useUi } from '~/stores/ui';

const userForEmail = (email: string): User => {
  const known = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (known) return known;
  const name = email.split('@').at(0) ?? email;
  return { name, email, role: Role.enum.member };
};

const loginSchema = (t: Translate) =>
  z.object({
    email: z.email(t(msg`Enter a valid email address`)),
    password: z.string().min(1, t(msg`Enter any password`)),
  });

const LoginForm: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useLingui();
  const login = useAuth((s) => s.login);

  const schema = useMemo(() => loginSchema(t), [t]);

  const form = useForm({
    mode: 'controlled',
    initialValues: { email: '', password: '' },
    validate: schemaResolver(schema, { sync: true }),
  });

  const adminEmail = DEMO_USERS.admin.email;

  const enter = (user: User) => {
    login(user);
    onDone();
  };

  return (
    <Stack gap="md">
      <Alert icon={<Info />} color="yellow" variant="light">
        <Trans>This is a demo. Nothing is checked: any password works, and nothing leaves this browser.</Trans>
      </Alert>
      <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
        <Button variant="light" onClick={() => enter(DEMO_USERS.member)}>
          <Trans>Continue as member</Trans>
        </Button>
        <Button variant="light" onClick={() => enter(DEMO_USERS.admin)}>
          <Trans>Continue as admin</Trans>
        </Button>
      </SimpleGrid>
      <Divider label={t`or log in with email`} />
      <form onSubmit={form.onSubmit(({ email }) => enter(userForEmail(email.trim())))} noValidate>
        <Stack gap="sm">
          <TextInput
            label={t`Email`}
            type="email"
            autoComplete="email"
            data-autofocus
            {...form.getInputProps('email')}
          />
          <PasswordInput label={t`Password`} autoComplete="current-password" {...form.getInputProps('password')} />
          <Text size="xs" c="dimmed">
            <Trans>Use {adminEmail} to log in as admin. Any other email logs you in as a member.</Trans>
          </Text>
          <Button type="submit" leftSection={<SignIn />}>
            <Trans>Log in</Trans>
          </Button>
        </Stack>
      </form>
    </Stack>
  );
};

export const LoginModal = memo(() => {
  const { t } = useLingui();
  const opened = useUi((s) => s.loginOpened);
  const close = useUi((s) => s.closeLogin);
  const mobile = useIsMobile();

  if (mobile) {
    return (
      <BottomSheet opened={opened} onClose={close} handle>
        <Stack gap="md" p="lg" pt="sm" pb="calc(20px + env(safe-area-inset-bottom))">
          <Text fw={600} size="lg">
            {t`Log in`}
          </Text>
          <LoginForm onDone={close} />
        </Stack>
      </BottomSheet>
    );
  }

  return (
    <Modal opened={opened} onClose={close} title={t`Log in`} centered>
      <LoginForm onDone={close} />
    </Modal>
  );
});
