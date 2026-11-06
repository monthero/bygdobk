import { Trans, useLingui } from '@lingui/react/macro';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import type { FC, ReactNode } from 'react';

import { useSiteContent } from '~/cms/content';
import { Clock } from '~/components/ui';
import { MembershipStatus, type Membership } from '~/memberships/model';
import { membershipErrorMessage, useCancelRequest } from '~/memberships/queries';
import { date, formatDate, SHORT_DATE, today, wallTime } from '~/utils/dates';

const SHOWN = new Set<MembershipStatus>([MembershipStatus.enum.requested, MembershipStatus.enum.active]);

const SELF_START = { alignSelf: 'flex-start' } as const;

const isShown = (m: Membership) => SHOWN.has(m.status) && !date(m.endDate).isBefore(today(), 'day');

const shortDay = (iso: string) => formatDate(date(iso), SHORT_DATE);

const RequestRow: FC<{ membership: Membership; title: string }> = ({ membership, title }) => {
  const { i18n } = useLingui();
  const cancel = useCancelRequest();
  const sent = formatDate(wallTime(membership.createdAt), SHORT_DATE);
  return (
    <Stack gap={2}>
      <Group justify="space-between" wrap="nowrap" gap="xs" align="flex-start">
        <Stack gap={0} miw={0}>
          <Text size="sm" fw={600} truncate>
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            <Trans>Sent {sent}</Trans>
          </Text>
        </Stack>
        <Badge size="sm" variant="light" color="blue" leftSection={<Clock />}>
          <Trans comment="Badge: membership request waiting for the board">Requested</Trans>
        </Badge>
      </Group>
      <Button
        size="compact-xs"
        variant="subtle"
        color="red"
        loading={cancel.isPending}
        onClick={() => cancel.mutate(membership.id)}
        style={SELF_START}
      >
        <Trans>Cancel request</Trans>
      </Button>
      {cancel.isError && (
        <Text size="xs" c="red" role="alert">
          {i18n._(membershipErrorMessage(cancel.error))}
        </Text>
      )}
    </Stack>
  );
};

const ActiveRow: FC<{ membership: Membership; title: string }> = ({ membership, title }) => {
  const { t } = useLingui();
  const from = shortDay(membership.startDate);
  const until = shortDay(membership.endDate);
  return (
    <Group justify="space-between" wrap="nowrap" gap="xs">
      <Stack gap={0} miw={0}>
        <Text size="sm" fw={600} truncate>
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          {date(membership.startDate).isAfter(today(), 'day') ? (
            <Trans>From {from}</Trans>
          ) : (
            <Trans>Until {until}</Trans>
          )}
        </Text>
      </Stack>
      <Badge size="sm" variant="light" color={membership.paidAt ? 'teal' : 'orange'}>
        {membership.paidAt ? t`Paid` : t`Not paid yet`}
      </Badge>
    </Group>
  );
};

type Props = { memberships: readonly Membership[]; empty?: ReactNode };

export const MyMemberships: FC<Props> = ({ memberships, empty = null }) => {
  const { plans } = useSiteContent();
  const shown = memberships.filter(isShown);
  if (shown.length === 0) return empty;

  return (
    <Stack gap={6}>
      <Text size="xs" fw={700} tt="uppercase" c="dimmed">
        <Trans>Your memberships</Trans>
      </Text>
      {shown.map((m) => {
        const plan = plans.find((p) => p.id === m.planId)?.name ?? m.planId;
        const title = m.playerName ? `${plan} · ${m.playerName}` : plan;
        return m.status === MembershipStatus.enum.requested ? (
          <RequestRow key={m.id} membership={m} title={title} />
        ) : (
          <ActiveRow key={m.id} membership={m} title={title} />
        );
      })}
    </Stack>
  );
};
