import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import type { Plan } from '~/cms/content';
import type { Translate } from '~/i18n/current';
import type { AdminMembership } from '~/memberships/model';
import { date } from '~/utils/dates';
import { downloadFile } from '~/utils/download';

import { memberName, PAYMENT_LABELS, planName } from './format';

type Context = { plans: ReadonlyMap<string, Plan>; translate: Translate };
type Column = { header: MessageDescriptor; value: (m: AdminMembership, context: Context) => string };

const BOM = '﻿';
const SEPARATOR = ';';
const LINE_END = '\r\n';
const CSV_TYPE = 'text/csv;charset=utf-8';
const CSV_DATE = 'YYYY-MM-DD';
const FORMULA_START = /^[=+\-@\t\r]/;

const PAID = msg`Paid`;
const NOT_PAID = msg`Not paid`;

const csvDay = (iso: string) => date(iso).format(CSV_DATE);

const COLUMNS: Column[] = [
  { header: msg`Name`, value: (m) => memberName(m) },
  { header: msg`Email`, value: (m) => m.profile?.email ?? '' },
  { header: msg`Plan`, value: (m, { plans }) => planName(plans, m.planId) },
  { header: msg`Start`, value: (m) => csvDay(m.startDate) },
  { header: msg`End`, value: (m) => csvDay(m.endDate) },
  {
    header: msg({ message: 'Price (kr)', comment: 'Spreadsheet column: price in Norwegian kroner' }),
    value: (m) => String(m.priceNok),
  },
  { header: msg`Status`, value: (m, { translate }) => translate(m.paidAt ? PAID : NOT_PAID) },
  { header: msg`Paid on`, value: (m) => (m.paidAt ? csvDay(m.paidAt) : '') },
  {
    header: msg({ message: 'Paid with', comment: 'Label for the payment method, like Vipps or cash' }),
    value: (m, { translate }) => (m.paymentMethod ? translate(PAYMENT_LABELS[m.paymentMethod]) : ''),
  },
  { header: msg`Note`, value: (m) => m.note ?? '' },
];

const cell = (value: string) => {
  // Stops Excel from running a name or note as a formula.
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
};

const line = (values: readonly string[]) => values.map(cell).join(SEPARATOR) + LINE_END;

export const membersCsv = (memberships: readonly AdminMembership[], context: Context) => {
  let csv = BOM + line(COLUMNS.map((c) => context.translate(c.header)));
  for (const m of memberships) csv += line(COLUMNS.map((c) => c.value(m, context)));
  return csv;
};

export const csvFileName = (seasonId: string) => `medlemmer-${seasonId}.csv`;

export const downloadCsv = (csv: string, fileName: string) => downloadFile(csv, fileName, CSV_TYPE);
