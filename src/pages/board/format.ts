import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import type { DateFormatter } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { createElement } from 'react';
import { z } from 'zod';

import { seasonOf } from '~/cms/calendar';
import type { Plan } from '~/cms/content';
import { Check, Warning } from '~/components/ui';
import { PaymentMethod, type AdminMembership, type Membership } from '~/memberships/model';
import { personName } from '~/supabase/profile';
import { date, formatDate, formatDateRange, ISO_DAY, SHORT_DATE, today, wallTime } from '~/utils/dates';

export const PAYMENT_LABELS: Record<PaymentMethod, MessageDescriptor> = {
  [PaymentMethod.enum.vipps]: msg({ message: 'Vipps', comment: 'Payment method: the Norwegian mobile payment app' }),
  [PaymentMethod.enum.bank_transfer]: msg({ message: 'Bank transfer', comment: 'Payment method' }),
  [PaymentMethod.enum.card]: msg({ message: 'Card', comment: 'Payment method: paid with a bank card' }),
  [PaymentMethod.enum.cash]: msg({ message: 'Cash', comment: 'Payment method' }),
  [PaymentMethod.enum.member_site]: msg({
    message: 'Member site',
    comment: 'Payment method: paid on the external membership website',
  }),
  [PaymentMethod.enum.other]: msg({ message: 'Other', comment: 'Payment method that is none of the listed ones' }),
};

export const NO_PAID_DAY = msg`Pick the day they paid`;
export const NO_METHOD = msg`Pick how they paid`;

export const memberName = (m: AdminMembership) => personName(m.playerName, m.profile);

export const ALL_SEASONS = 'alle';

export const MembersTab = z.enum(['oversikt', 'medlemmer', 'foresporsler']);
export type MembersTab = z.infer<typeof MembersTab>;

export const SEASON_ID = /^\d{4}-\d{2}$/;

export const seasonById = (id: string) => seasonOf(date(`${id.slice(0, 4)}-08-01`));

export const previousSeason = (id: string) => seasonById(String(Number(id.slice(0, 4)) - 1));

export const planName = (plans: ReadonlyMap<string, Plan>, id: string) => plans.get(id)?.name ?? id;

export const formatDay = (iso: string) => formatDate(date(iso), SHORT_DATE);

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

export const formatWhen = (iso: string) => {
  const day = wallTime(iso);
  return formatDate(day, day.isSame(today(), 'year') ? DAY_MONTH : SHORT_DATE);
};

export const sameDay = (a: string, b: string) => wallTime(a).isSame(wallTime(b), 'day');

export const formatPeriod = (m: Pick<Membership, 'startDate' | 'endDate'>) =>
  formatDateRange(date(m.startDate), date(m.endDate), SHORT_DATE);

export const paidAtOf = (day: string) => date(day).toISOString();

export const paidDayOf = (paidAt: string) => date(paidAt).format(ISO_DAY);

export const DAY_FORMATTER: DateFormatter = ({ date: value }) => (typeof value === 'string' ? formatDay(value) : '');

const DONE_ICON = createElement(Check);
const FAILED_ICON = createElement(Warning);

export const notifyDone = (message: string) => notifications.show({ message, color: 'teal', icon: DONE_ICON });

export const notifyFailed = (message: string) => notifications.show({ message, color: 'red', icon: FAILED_ICON });
