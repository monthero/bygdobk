import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMemo, type FC } from 'react';
import { z } from 'zod';

import { accessErrorMessage, useGrantAdmin } from '~/access/queries';
import { UserPlus } from '~/components/ui';
import type { Translate } from '~/i18n/current';
import type { BoardProfile } from '~/memberships/model';
import { notifyDone } from '~/pages/board/format';

import classes from './AccessPage.module.css';

const INITIAL = { email: '' };

const addSchema = (t: Translate) =>
  z.object({
    email: z
      .string()
      .trim()
      .pipe(z.email(t(msg`Enter a valid email address`))),
  });

type Props = { admins: BoardProfile[] | undefined };

export const AddAdminForm: FC<Props> = ({ admins }) => {
  const { i18n, t } = useLingui();
  const schema = useMemo(() => addSchema(t), [t]);
  const form = useForm({ initialValues: INITIAL, validate: schemaResolver(schema, { sync: true }) });
  const grant = useGrantAdmin();

  const submit = form.onSubmit(({ email }) => {
    const address = email.trim().toLowerCase();
    const existing = admins?.find((a) => a.email.toLowerCase() === address);
    if (existing) {
      const name = existing.name;
      form.setFieldError('email', t`${name} is already an admin.`);
      return;
    }
    grant.mutate(address, {
      onSuccess: ({ name }) => {
        notifyDone(t`${name} is now an admin`);
        form.reset();
      },
      onError: (error) => form.setFieldError('email', i18n._(accessErrorMessage(error))),
    });
  });

  return (
    <Paper withBorder radius="md" p="md" component="section" aria-labelledby="add-admin">
      <form onSubmit={submit} noValidate>
        <Stack gap="sm">
          <div>
            <Title order={2} size="h4" id="add-admin">
              <Trans>Add an admin</Trans>
            </Title>
            <Text size="sm" c="dimmed">
              <Trans>Use the email they log in with.</Trans>
            </Text>
          </div>
          <div className={classes.add}>
            <TextInput
              className={classes.add__input}
              aria-label={t`Email`}
              placeholder={t`name@example.com`}
              type="email"
              autoComplete="off"
              {...form.getInputProps('email')}
            />
            <Button type="submit" leftSection={<UserPlus />} loading={grant.isPending} disabled={!admins}>
              <Trans>Add admin</Trans>
            </Button>
          </div>
        </Stack>
      </form>
    </Paper>
  );
};
