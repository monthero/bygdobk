import { plural } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { schemaResolver, useForm } from '@mantine/form';
import { useMemo, useState, type FC } from 'react';
import { z } from 'zod';

import { Coins, Warning } from '~/components/ui';
import type { Translate } from '~/i18n/current';
import { PaymentMethod, type AdminMembership } from '~/memberships/model';
import { membershipErrorMessage, useMarkPaid } from '~/memberships/queries';
import { kr } from '~/pages/join/offers';
import { todayIso } from '~/utils/dates';

import { memberName, NO_METHOD, NO_PAID_DAY, notifyDone, paidAtOf } from './format';
import { PaymentFields } from './PaymentFields';

type PaidValues = { paidOn: string | null; paymentMethod: PaymentMethod | null };
type Missed = { names: string[]; error: Error | undefined };

const paidSchema = (t: Translate) =>
  z.object({ paidOn: z.string(t(NO_PAID_DAY)), paymentMethod: z.enum(PaymentMethod.options, t(NO_METHOD)) });

const Summary: FC<{ memberships: readonly AdminMembership[] }> = ({ memberships }) => {
  const total = kr(memberships.reduce((sum, m) => sum + m.priceNok, 0));
  const first = memberships.at(0);
  if (memberships.length === 1 && first) {
    const name = memberName(first);
    return (
      <Text>
        <Trans>
          {name} paid <strong>{total}</strong>.
        </Trans>
      </Text>
    );
  }
  const count = memberships.length;
  return (
    <Stack gap={4}>
      <Text>
        <Trans>
          <Plural value={count} one="# membership" other="# memberships" />, <strong>{total}</strong> in total.
        </Trans>
      </Text>
      <Text size="sm" c="dimmed" lineClamp={3}>
        {memberships.map(memberName).join(', ')}
      </Text>
    </Stack>
  );
};

type FormProps = { memberships: readonly AdminMembership[]; onDone: () => void; onPaid?: () => void };

const MarkPaidForm: FC<FormProps> = ({ memberships, onDone, onPaid }) => {
  const { i18n, t } = useLingui();
  const schema = useMemo(() => paidSchema(t), [t]);
  const form = useForm<PaidValues>({
    initialValues: { paidOn: todayIso(), paymentMethod: null },
    validate: schemaResolver(schema, { sync: true }),
  });
  const markPaid = useMarkPaid();
  const [items, setItems] = useState(memberships);
  const [missed, setMissed] = useState<Missed>();
  const count = items.length;

  const submit = form.onSubmit(({ paidOn, paymentMethod }) => {
    if (!paidOn || !paymentMethod) return;
    const only = items.at(0);
    setMissed(undefined);
    markPaid.mutate(
      { ids: items.map((m) => m.id), paidAt: paidAtOf(paidOn), paymentMethod },
      {
        onSuccess: ({ paid, missed: missedIds, error }) => {
          const done = paid.length;
          if (count === 1 && only && missedIds.length === 0) {
            const name = memberName(only);
            notifyDone(t`${name} is marked as paid`);
          } else if (done > 0) {
            notifyDone(t`Marked ${plural(done, { one: '# membership', other: '# memberships' })} as paid`);
          }
          if (missedIds.length === 0) {
            onPaid?.();
            onDone();
            return;
          }
          const left = new Set(missedIds);
          const rest = items.filter((m) => left.has(m.id));
          setItems(rest);
          setMissed({ names: rest.map(memberName), error });
        },
      },
    );
  });

  const missedNames = missed?.names.join(', ');

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        <Summary memberships={items} />
        <PaymentFields day={form.getInputProps('paidOn')} method={form.getInputProps('paymentMethod')} />
        {markPaid.isError && (
          <Alert color="red" variant="light" icon={<Warning />}>
            {i18n._(membershipErrorMessage(markPaid.error))}
          </Alert>
        )}
        {missed && (
          <Alert color="orange" variant="light" icon={<Warning />} title={t`Not marked as paid: ${missedNames}`}>
            {missed.error ? (
              i18n._(membershipErrorMessage(missed.error))
            ) : (
              <Trans>Someone else may already have marked them as paid or deleted them.</Trans>
            )}
          </Alert>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" leftSection={<Coins />} loading={markPaid.isPending} disabled={count === 0}>
            {count === 1 ? <Trans>Mark as paid</Trans> : <Trans>Mark {count} as paid</Trans>}
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

type Props = {
  opened: boolean;
  memberships: readonly AdminMembership[];
  onClose: () => void;
  onPaid?: () => void;
};

export const MarkPaidModal: FC<Props> = ({ opened, memberships, onClose, onPaid }) => {
  const { t } = useLingui();
  return (
    <Modal opened={opened} onClose={onClose} title={t`Mark as paid`} centered>
      <MarkPaidForm memberships={memberships} onDone={onClose} onPaid={onPaid} />
    </Modal>
  );
};
