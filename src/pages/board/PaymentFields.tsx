import { useLingui } from '@lingui/react/macro';
import { Select, SimpleGrid } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import type { GetInputPropsReturnType } from '@mantine/form';
import { useMemo, type FC } from 'react';

import { CalendarBlank } from '~/components/ui';
import { PaymentMethod } from '~/memberships/model';
import { todayIso } from '~/utils/dates';

import { DAY_FORMATTER, PAYMENT_LABELS } from './format';

type Props = { day: GetInputPropsReturnType; method: GetInputPropsReturnType };

export const PaymentFields: FC<Props> = ({ day, method }) => {
  const { i18n, t } = useLingui();
  const methods = useMemo(
    () => PaymentMethod.options.map((value) => ({ value, label: i18n._(PAYMENT_LABELS[value]) })),
    [i18n],
  );

  return (
    <SimpleGrid cols={{ base: 1, xs: 2 }}>
      <DatePickerInput
        label={t`Paid on`}
        leftSection={<CalendarBlank />}
        valueFormatter={DAY_FORMATTER}
        maxDate={todayIso()}
        withAsterisk
        {...day}
      />
      <Select
        label={t({ message: 'Paid with', comment: 'Label for the payment method, like Vipps or cash' })}
        placeholder={t`Pick one`}
        data={methods}
        allowDeselect={false}
        withAsterisk
        {...method}
      />
    </SimpleGrid>
  );
};
