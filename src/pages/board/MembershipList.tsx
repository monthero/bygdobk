import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Skeleton,
  Stack,
  Table,
  Text,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import { memo, type FC } from 'react';

import type { Plan } from '~/cms/content';
import { ArrowCounterClockwise, Check, CheckCircle, Clock, Coins, PencilSimple, Trash, X } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import { MembershipStatus, type AdminMembership } from '~/memberships/model';
import { membershipErrorMessage, useUpdateMembership } from '~/memberships/queries';
import { kr } from '~/pages/join/offers';
import { personName } from '~/supabase/profile';

import { formatDay, formatPeriod, memberName, notifyFailed, notifyDone, PAYMENT_LABELS, planName } from './format';

type Handlers = {
  onPay: (m: AdminMembership) => void;
  onEdit: (m: AdminMembership) => void;
  onDelete: (m: AdminMembership) => void;
  onDecline: (m: AdminMembership) => void;
};

type ItemProps = Handlers & { membership: AdminMembership; plans: ReadonlyMap<string, Plan> };

const SKELETON_ROWS = Array.from({ length: 5 }, (_, i) => i);
const TABLE_MIN_WIDTH = 900;

const PaidBadge: FC<{ membership: AdminMembership }> = ({ membership: { paidAt, paymentMethod } }) => {
  const { i18n } = useLingui();
  if (!paidAt) {
    return (
      <Badge color="orange" variant="light" leftSection={<Clock />}>
        <Trans>Not paid</Trans>
      </Badge>
    );
  }
  const day = formatDay(paidAt);
  return (
    <Badge color="green" variant="light" leftSection={<CheckCircle />}>
      {paymentMethod ? `${day} · ${i18n._(PAYMENT_LABELS[paymentMethod])}` : day}
    </Badge>
  );
};

const StatusCell: FC<{ membership: AdminMembership }> = ({ membership }) => {
  if (membership.status === MembershipStatus.enum.active) return <PaidBadge membership={membership} />;
  const by = personName(null, membership.requester);
  const day = formatDay(membership.createdAt);
  return (
    <Stack gap={2} align="flex-start">
      {membership.status === MembershipStatus.enum.requested ? (
        <Badge color="blue" variant="light" leftSection={<Clock />}>
          <Trans comment="Badge: membership request waiting for the board">Requested</Trans>
        </Badge>
      ) : (
        <Badge color="gray" variant="light" leftSection={<X />}>
          <Trans comment="Badge: the board said no to this membership request">Declined</Trans>
        </Badge>
      )}
      <Text size="xs" c="dimmed">
        <Trans comment="Who sent a membership request, and when">
          By {by}, {day}
        </Trans>
      </Text>
    </Stack>
  );
};

const StatusButton: FC<{ membership: AdminMembership; to: MembershipStatus }> = ({ membership, to }) => {
  const { i18n, t } = useLingui();
  const update = useUpdateMembership();
  const name = memberName(membership);
  const approve = to === MembershipStatus.enum.active;
  const change = () =>
    update.mutate(
      { id: membership.id, patch: { status: to } },
      {
        onSuccess: () => notifyDone(approve ? t`${name} is in!` : t`The request from ${name} is open again`),
        onError: (error) => notifyFailed(i18n._(membershipErrorMessage(error))),
      },
    );
  return (
    <Button
      size="compact-sm"
      variant="light"
      color={approve ? 'teal' : 'gray'}
      leftSection={approve ? <Check /> : <ArrowCounterClockwise />}
      loading={update.isPending}
      onClick={change}
    >
      {approve ? (
        <Trans>Approve</Trans>
      ) : (
        <Trans comment="Button: undo declining a membership request">Undo decline</Trans>
      )}
    </Button>
  );
};

const Account: FC<{ membership: AdminMembership }> = ({ membership: { profile, playerName } }) => {
  if (!profile) {
    return (
      <Text size="sm" c="dimmed">
        <Trans>No account</Trans>
      </Text>
    );
  }
  return (
    <div>
      <Text size="sm">{profile.email}</Text>
      {playerName !== null && (
        <Text size="xs" c="dimmed">
          {profile.name}
        </Text>
      )}
    </div>
  );
};

const Actions: FC<Handlers & { membership: AdminMembership }> = ({
  membership,
  onPay,
  onEdit,
  onDelete,
  onDecline,
}) => {
  const { t } = useLingui();
  const name = memberName(membership);
  const { status } = membership;
  return (
    <Group gap={4} wrap="nowrap" justify="flex-end">
      {status === MembershipStatus.enum.requested && (
        <>
          <StatusButton membership={membership} to={MembershipStatus.enum.active} />
          <Button
            size="compact-sm"
            variant="subtle"
            color="red"
            leftSection={<X />}
            onClick={() => onDecline(membership)}
          >
            <Trans comment="Button: say no to a membership request">Decline</Trans>
          </Button>
        </>
      )}
      {status === MembershipStatus.enum.declined && (
        <StatusButton membership={membership} to={MembershipStatus.enum.requested} />
      )}
      {status === MembershipStatus.enum.active && !membership.paidAt && (
        <Button size="compact-sm" variant="light" leftSection={<Coins />} onClick={() => onPay(membership)}>
          <Trans>Mark as paid</Trans>
        </Button>
      )}
      <Tooltip label={t`Edit`}>
        <ActionIcon variant="subtle" color="gray" aria-label={t`Edit ${name}`} onClick={() => onEdit(membership)}>
          <PencilSimple />
        </ActionIcon>
      </Tooltip>
      <Tooltip label={t`Delete`}>
        <ActionIcon variant="subtle" color="red" aria-label={t`Delete ${name}`} onClick={() => onDelete(membership)}>
          <Trash />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};

const MembershipRow = memo<ItemProps>(({ membership, plans, ...handlers }) => (
  <Table.Tr>
    <Table.Td fw={600}>{memberName(membership)}</Table.Td>
    <Table.Td>
      <Account membership={membership} />
    </Table.Td>
    <Table.Td>{planName(plans, membership.planId)}</Table.Td>
    <Table.Td>{formatPeriod(membership)}</Table.Td>
    <Table.Td ta="end" className="tabular">
      {kr(membership.priceNok)}
    </Table.Td>
    <Table.Td>
      <StatusCell membership={membership} />
    </Table.Td>
    <Table.Td>
      <Actions membership={membership} {...handlers} />
    </Table.Td>
  </Table.Tr>
));

const MembershipCard = memo<ItemProps>(({ membership, plans, ...handlers }) => (
  <Card withBorder radius="lg" padding="md">
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
      <Stack gap={2} miw={0}>
        <Text fw={700}>{memberName(membership)}</Text>
        <Account membership={membership} />
      </Stack>
      <StatusCell membership={membership} />
    </Group>
    <Group justify="space-between" wrap="nowrap" mt="sm">
      <Text size="sm">{planName(plans, membership.planId)}</Text>
      <Text size="sm" fw={600} className="tabular">
        {kr(membership.priceNok)}
      </Text>
    </Group>
    <Text size="sm" c="dimmed">
      {formatPeriod(membership)}
    </Text>
    <Divider my="sm" />
    <Actions membership={membership} {...handlers} />
  </Card>
));

type Props = Handlers & {
  memberships: readonly AdminMembership[];
  plans: ReadonlyMap<string, Plan>;
  requests: boolean;
};

export const MembershipList: FC<Props> = ({ memberships, requests, ...rest }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Stack gap="sm">
        {memberships.map((m) => (
          <MembershipCard key={m.id} membership={m} {...rest} />
        ))}
      </Stack>
    );
  }

  return (
    <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Trans>Name</Trans>
            </Table.Th>
            <Table.Th>
              <Trans comment="Table column: the user account linked to the membership">Account</Trans>
            </Table.Th>
            <Table.Th>
              <Trans comment="Table column: the membership plan, like Adults or Junior">Plan</Trans>
            </Table.Th>
            <Table.Th>
              <Trans comment="Table column: from and to date of the membership">Period</Trans>
            </Table.Th>
            <Table.Th ta="end">
              <Trans>Price</Trans>
            </Table.Th>
            <Table.Th>
              {requests ? (
                <Trans comment="Table column: where a membership request stands, and who sent it">Status</Trans>
              ) : (
                <Trans comment="Table column: whether and when the membership was paid">Paid</Trans>
              )}
            </Table.Th>
            <Table.Th>
              <VisuallyHidden>
                <Trans>Actions</Trans>
              </VisuallyHidden>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {memberships.map((m) => (
            <MembershipRow key={m.id} membership={m} {...rest} />
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
};

export const MembershipListSkeleton: FC = () => (
  <Stack gap="sm" aria-busy>
    {SKELETON_ROWS.map((i) => (
      <Skeleton key={i} height={56} radius="md" />
    ))}
  </Stack>
);
