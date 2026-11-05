import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates';
import { schemaResolver, useForm } from '@mantine/form';
import { useMemo, type FC } from 'react';
import { z } from 'zod';

import { Plus } from '~/components/ui';
import { CURRENT_SEASON } from '~/data/club';
import type { Translate } from '~/i18n/current';
import { useContent } from '~/stores/content';
import { dayjs, ISO_DAY } from '~/utils/dates';

const REASON_MAX_LENGTH = 120;

const closureSchema = (t: Translate) =>
  z.object({
    range: z
      .tuple([z.string().nullable(), z.string().nullable()])
      .refine(([from, to]) => Boolean(from && to), t(msg`Pick the first and last day`)),
    reason: z
      .string()
      .trim()
      .min(1, t(msg`Write a short reason`)),
  });

const AddClosureForm: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { t } = useLingui();

  const schema = useMemo(() => closureSchema(t), [t]);

  const form = useForm({
    mode: 'controlled',
    initialValues: { range: [null, null] as DatesRangeValue<string>, reason: '' },
    validate: schemaResolver(schema, { sync: true }),
  });

  const submit = form.onSubmit(({ range: [from, to], reason }) => {
    if (!from || !to) return;
    const { closures, setClosures } = useContent.getState();
    setClosures([...closures, { id: crypto.randomUUID(), from, to, reason: reason.trim() }]);
    onDone();
  });

  const today = dayjs().format(ISO_DAY);

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        <DatePickerInput
          type="range"
          allowSingleDateInRange
          label={t`Dates`}
          description={t`Pick one day, or the first and last day`}
          placeholder={t`Pick dates`}
          valueFormat="D MMM YYYY"
          defaultDate={today < CURRENT_SEASON.start ? CURRENT_SEASON.start : today}
          withAsterisk
          data-autofocus
          {...form.getInputProps('range')}
        />
        <TextInput
          label={t`Reason`}
          placeholder={t`For example: Hall closed for maintenance`}
          maxLength={REASON_MAX_LENGTH}
          withAsterisk
          {...form.getInputProps('reason')}
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onDone}>
            <Trans>Cancel</Trans>
          </Button>
          <Button type="submit" leftSection={<Plus />}>
            <Trans>Add break</Trans>
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

type Props = { opened: boolean; onClose: () => void };

export const AddClosureModal: FC<Props> = ({ opened, onClose }) => {
  const { t } = useLingui();

  return (
    <Modal opened={opened} onClose={onClose} title={t`Add a training break`} centered>
      <AddClosureForm onDone={onClose} />
    </Modal>
  );
};
