import '@mantine/dates/styles.css';
import { useLingui } from '@lingui/react';
import { DatesProvider, type DatesProviderSettings } from '@mantine/dates';
import { useMemo, type FC, type ReactNode } from 'react';

import { currentLocale } from '~/i18n/current';
import { LOCALE_META } from '~/i18n/locales';

const WEEKEND_DAYS: DatesProviderSettings['weekendDays'] = [0, 6];

export const BoardDatesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  useLingui();
  const locale = LOCALE_META[currentLocale()].dayjs;
  const settings = useMemo<DatesProviderSettings>(
    () => ({ locale, firstDayOfWeek: 1, weekendDays: WEEKEND_DAYS }),
    [locale],
  );
  return <DatesProvider settings={settings}>{children}</DatesProvider>;
};
