import { Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMemo, type FC } from 'react';
import { z } from 'zod';

import { Coins, Warning } from '~/components/ui';
import type { Translate } from '~/i18n/current';
import { PaymentMethod, type AdminMembership } from '~/memberships/model';
import { membershipErrorMessage, useUpdateMembership } from '~/memberships/queries';
import { kr } from '~/pages/join/offers';
import { todayIso } from '~/utils/dates';

import { memberName, NO_METHOD, NO_PAID_DAY, notifyDone, paidAtOf } from './format';
import { PaymentFields } from './PaymentFields';

type PaidValues = { paidOn: string | null; paymentMethod: PaymentMethod | null };

const paidSchema = (t: Translate) =>
  z.object({ paidOn: z.string(t(NO_PAID_DAY)), paymentMethod: z.enum(PaymentMethod.options, t(NO_METHOD)) });

const MarkPaidForm: FC<{ membership: AdminMembership; onDone: () => void }> = ({ membership, onDone }) => {
  const { i18n, t } = useLingui();
  const schema = useMemo(() => paidSchema(t), [t]);
  const form = useForm<PaidValues>({
    initialValues: { paidOn: todayIso(), paymentMethod: null },
    validate: schemaResolver(schema, { sync: true }),
  });
  const update = useUpdateMembership();
  const name = memberName(membership);
  const price = kr(membership.priceNok);

  const submit = form.onSubmit(({ paidOn, paymentMethod }) => {
    if (!paidOn || !paymentMethod) return;
    update.mutate(
      { id: membership.id, patch: { paidAt: paidAtOf(paidOn), paymentMethod } },
      {
        onSuccess: () => {
          notifyDone(t`${name} is marked as paid`);
          onDone();
        },
      },
    );
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        <Text>
          <Trans>
            {name} paid <strong>{price}</strong>.
          </Trans>
        </Text>
        <PaymentFields day={form.getInputProps('paidOn')} method={form.getInputProps('paymentMethod')} />
        {update.isError && (
          <Alert color="red" variant="light" icon={<Warning />}>
            {i18n._(membershipErrorMessage(update.error))}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" leftSection={<Coins />} loading={update.isPending}>
            <Trans>Mark as paid</Trans>
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

type Props = { opened: boolean; membership: AdminMembership | undefined; onClose: () => void };

export const MarkPaidModal: FC<Props> = ({ opened, membership, onClose }) => {
  const { t } = useLingui();
  return (
    <Modal opened={opened} onClose={onClose} title={t`Mark as paid`} centered>
      {membership && <MarkPaidForm key={membership.id} membership={membership} onDone={onClose} />}
    </Modal>
  );
};
