import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Card, Group, Progress, SimpleGrid, Skeleton, Stack, Table, Text, Title } from '@mantine/core';
import { useTimeout } from '@mantine/hooks';
import { useMemo, useState, type FC, type ReactNode } from 'react';

import type { Plan } from '~/cms/content';
import { Check, CheckCircle, Clock, DownloadSimple } from '~/components/ui';
import type { AdminMembership } from '~/memberships/model';
import { kr } from '~/pages/join/offers';
import { percent } from '~/utils/numbers';

import { planName } from './format';
import { csvFileName, downloadCsv, membersCsv } from './membersCsv';

type Tally = { members: number; paid: number; received: number; expected: number };
type PlanRow = Tally & { planId: string; name: string };

const DONE_MS = 2500;
const TABLE_MIN_WIDTH = 520;
const SKELETON_CARDS = [0, 1, 2];
const RECEIVED = msg({ message: 'Received', comment: 'Money paid in so far for memberships' });

const newTally = (): Tally => ({ members: 0, paid: 0, received: 0, expected: 0 });

const count = (tally: Tally, m: AdminMembership) => {
  tally.members += 1;
  tally.expected += m.priceNok;
  if (m.paidAt) {
    tally.paid += 1;
    tally.received += m.priceNok;
  }
};

const tallyOf = (memberships: readonly AdminMembership[], plans: ReadonlyMap<string, Plan>) => {
  const total = newTally();
  const byPlan = new Map<string, Tally>();
  for (const m of memberships) {
    count(total, m);
    const tally = byPlan.get(m.planId) ?? newTally();
    byPlan.set(m.planId, tally);
    count(tally, m);
  }
  const order = new Map(Array.from(plans.keys(), (id, i) => [id, i]));
  const rows: PlanRow[] = Array.from(byPlan, ([planId, tally]) => ({
    planId,
    name: planName(plans, planId),
    ...tally,
  }));
  rows.sort(
    (a, b) => (order.get(a.planId) ?? Infinity) - (order.get(b.planId) ?? Infinity) || a.name.localeCompare(b.name),
  );
  return { total, rows };
};

const StatCard: FC<{ label: ReactNode; value: ReactNode; children?: ReactNode }> = ({ label, value, children }) => (
  <Card withBorder radius="lg" padding="md">
    <Stack gap={6}>
      <Text size="sm" c="dimmed" fw={600}>
        {label}
      </Text>
      <Text fz={32} fw={800} lh={1.1} className="tabular">
        {value}
      </Text>
      {children}
    </Stack>
  </Card>
);

const PaidCard: FC<{ total: Tally; onShowUnpaid: () => void }> = ({ total, onShowUnpaid }) => {
  const { t } = useLingui();
  const unpaidCount = total.members - total.paid;
  const allPaid = unpaidCount === 0;
  return (
    <StatCard label={<Trans>Paid</Trans>} value={total.paid}>
      <Progress
        size="sm"
        radius="xl"
        value={percent(total.paid, total.members)}
        color={allPaid ? 'teal' : undefined}
        aria-label={t`Paid`}
      />
      {allPaid ? (
        <Group gap={6} c="teal">
          <CheckCircle aria-hidden />
          <Text size="sm" fw={600}>
            <Trans>Everyone has paid!</Trans>
          </Text>
        </Group>
      ) : (
        <Group gap={6} justify="space-between" wrap="nowrap">
          <Group gap={6} c="orange" wrap="nowrap">
            <Clock aria-hidden />
            <Text size="sm" fw={600} className="tabular">
              <Trans>{unpaidCount} not paid</Trans>
            </Text>
          </Group>
          <Button size="compact-sm" variant="subtle" onClick={onShowUnpaid}>
            <Trans comment="Button: list the members who have not paid yet">Show who</Trans>
          </Button>
        </Group>
      )}
    </StatCard>
  );
};

const KronerCard: FC<{ total: Tally }> = ({ total }) => {
  const { i18n } = useLingui();
  const expected = kr(total.expected);
  const label = i18n._(RECEIVED);
  return (
    <StatCard label={label} value={kr(total.received)}>
      <Progress
        size="sm"
        radius="xl"
        value={percent(total.received, total.expected)}
        color={total.received >= total.expected ? 'teal' : undefined}
        aria-label={label}
      />
      <Text size="sm" c="dimmed" className="tabular">
        <Trans comment="Below the kroner received, e.g. of kr 112 800">of {expected}</Trans>
      </Text>
    </StatCard>
  );
};

const PlanTable: FC<{ rows: readonly PlanRow[]; total: Tally }> = ({ rows, total }) => {
  const { i18n } = useLingui();
  return (
    <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Trans comment="Table column: the membership plan, like Adults or Junior">Plan</Trans>
            </Table.Th>
            <Table.Th ta="end">
              <Trans>Members</Trans>
            </Table.Th>
            <Table.Th ta="end">
              <Trans>Paid</Trans>
            </Table.Th>
            <Table.Th ta="end">{i18n._(RECEIVED)}</Table.Th>
            <Table.Th ta="end">
              <Trans comment="Table column: kroner the memberships should bring in">Expected</Trans>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.planId}>
              <Table.Td fw={600}>{row.name}</Table.Td>
              <Table.Td ta="end" className="tabular">
                {row.members}
              </Table.Td>
              <Table.Td ta="end" className="tabular" c={row.paid < row.members ? 'orange' : undefined}>
                {row.paid}
              </Table.Td>
              <Table.Td ta="end" className="tabular">
                {kr(row.received)}
              </Table.Td>
              <Table.Td ta="end" className="tabular">
                {kr(row.expected)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
        <Table.Tfoot>
          <Table.Tr fw={700}>
            <Table.Td>
              <Trans>Total</Trans>
            </Table.Td>
            <Table.Td ta="end" className="tabular">
              {total.members}
            </Table.Td>
            <Table.Td ta="end" className="tabular">
              {total.paid}
            </Table.Td>
            <Table.Td ta="end" className="tabular">
              {kr(total.received)}
            </Table.Td>
            <Table.Td ta="end" className="tabular">
              {kr(total.expected)}
            </Table.Td>
          </Table.Tr>
        </Table.Tfoot>
      </Table>
    </Table.ScrollContainer>
  );
};

const DownloadButton: FC<{
  memberships: readonly AdminMembership[];
  plans: ReadonlyMap<string, Plan>;
  seasonId: string;
}> = ({ memberships, plans, seasonId }) => {
  const { i18n } = useLingui();
  const [done, setDone] = useState(false);
  const { start } = useTimeout(() => setDone(false), DONE_MS);
  const download = () => {
    const csv = membersCsv(memberships, { plans, translate: (descriptor) => i18n._(descriptor) });
    downloadCsv(csv, csvFileName(seasonId));
    setDone(true);
    start();
  };
  return (
    <Button
      radius="xl"
      variant={done ? 'light' : 'default'}
      color={done ? 'teal' : undefined}
      leftSection={done ? <Check /> : <DownloadSimple />}
      onClick={download}
      aria-live="polite"
    >
      {done ? (
        <Trans comment="Shown briefly after the file was downloaded">Downloaded</Trans>
      ) : (
        <Trans comment="Button: save the memberships as a file for Excel">Download spreadsheet</Trans>
      )}
    </Button>
  );
};

type Props = {
  memberships: readonly AdminMembership[];
  plans: ReadonlyMap<string, Plan>;
  seasonId: string;
  onShowUnpaid: () => void;
};

export const MembersOverview: FC<Props> = ({ memberships, plans, seasonId, onShowUnpaid }) => {
  const { total, rows } = useMemo(() => tallyOf(memberships, plans), [memberships, plans]);
  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
        <StatCard label={<Trans>Memberships</Trans>} value={total.members} />
        <PaidCard total={total} onShowUnpaid={onShowUnpaid} />
        <KronerCard total={total} />
      </SimpleGrid>
      <Stack gap="xs">
        <Title order={2} size="h4">
          <Trans comment="Heading above a table that splits the numbers per membership plan">By plan</Trans>
        </Title>
        <PlanTable rows={rows} total={total} />
      </Stack>
      <Group justify="flex-end">
        <DownloadButton memberships={memberships} plans={plans} seasonId={seasonId} />
      </Group>
    </Stack>
  );
};

export const MembersOverviewSkeleton: FC = () => (
  <Stack gap="lg" aria-busy>
    <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
      {SKELETON_CARDS.map((i) => (
        <Skeleton key={i} height={120} radius="lg" />
      ))}
    </SimpleGrid>
    <Skeleton height={200} radius="md" />
  </Stack>
);
