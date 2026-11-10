import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
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

import { Author } from './Author';
import {
  formatDay,
  formatPeriod,
  formatWhen,
  memberName,
  notifyFailed,
  notifyDone,
  PAYMENT_LABELS,
  planName,
  sameDay,
} from './format';
import { isUnpaid } from './people';

import classes from './selection.module.css';

type Handlers = {
  onPay: (m: AdminMembership) => void;
  onEdit: (m: AdminMembership) => void;
  onDelete: (m: AdminMembership) => void;
  onDecline: (m: AdminMembership) => void;
};

export type OnSelect = (ids: readonly string[], selected: boolean) => void;

type ItemProps = Handlers & {
  membership: AdminMembership;
  plans: ReadonlyMap<string, Plan>;
  selected: boolean | undefined;
  onSelect: OnSelect | undefined;
};

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

const StatusBadge: FC<{ membership: AdminMembership }> = ({ membership }) => {
  switch (membership.status) {
    case MembershipStatus.enum.active:
      return <PaidBadge membership={membership} />;
    case MembershipStatus.enum.requested:
      return (
        <Badge color="blue" variant="light" leftSection={<Clock />}>
          <Trans comment="Badge: membership request waiting for the board">Requested</Trans>
        </Badge>
      );
    case MembershipStatus.enum.declined:
      return (
        <Badge color="gray" variant="light" leftSection={<X />}>
          <Trans comment="Badge: the board said no to this membership request">Declined</Trans>
        </Badge>
      );
  }
};

const isRepeat = (by: string | null, at: string, otherBy: string | null, otherAt: string | null) =>
  otherAt !== null && by === otherBy && sameDay(at, otherAt);

const Created: FC<{ membership: AdminMembership }> = ({ membership: m }) => {
  const who = <Author person={m.creator} />;
  const day = formatWhen(m.createdAt);
  if (m.status !== MembershipStatus.enum.active || m.decidedAt !== null) {
    return (
      <Trans comment="A member asked for this membership. {who} is a name or 'the board'">
        Requested by {who} · {day}
      </Trans>
    );
  }
  return (
    <Trans comment="Who added this membership. {who} is a name or 'the board'">
      Added by {who} · {day}
    </Trans>
  );
};

const Decided: FC<{ membership: AdminMembership; decidedAt: string }> = ({ membership: m, decidedAt }) => {
  const who = <Author person={m.decider} />;
  const day = formatWhen(decidedAt);
  if (m.status === MembershipStatus.enum.declined) {
    return (
      <Trans comment="Who said no to a membership request. {who} is a name or 'the board'">
        Declined by {who} · {day}
      </Trans>
    );
  }
  return (
    <Trans comment="Who said yes to a membership request. {who} is a name or 'the board'">
      Approved by {who} · {day}
    </Trans>
  );
};

const Changed: FC<{ membership: AdminMembership; updatedAt: string }> = ({ membership: m, updatedAt }) => {
  const who = <Author person={m.updater} />;
  const day = formatWhen(updatedAt);
  return (
    <Trans comment="Who last edited this membership. {who} is a name or 'the board'">
      Last changed by {who} · {day}
    </Trans>
  );
};

const Paid: FC<{ membership: AdminMembership }> = ({ membership: m }) => {
  const who = <Author person={m.paidMarker} />;
  return (
    <Trans comment="Who marked this membership as paid. {who} is a name or 'the board'">Marked paid by {who}</Trans>
  );
};

const Provenance: FC<{ membership: AdminMembership }> = ({ membership: m }) => {
  const { decidedAt, updatedAt } = m;
  const showChanged =
    updatedAt !== null &&
    !isRepeat(m.updatedBy, updatedAt, m.createdBy, m.createdAt) &&
    !isRepeat(m.updatedBy, updatedAt, m.decidedBy, decidedAt);
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        <Created membership={m} />
      </Text>
      {decidedAt && (
        <Text size="xs" c="dimmed">
          <Decided membership={m} decidedAt={decidedAt} />
        </Text>
      )}
      {m.paidAt && (
        <Text size="xs" c="dimmed">
          <Paid membership={m} />
        </Text>
      )}
      {showChanged && (
        <Text size="xs" c="dimmed">
          <Changed membership={m} updatedAt={updatedAt} />
        </Text>
      )}
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

const SelectBox: FC<{ membership: AdminMembership; checked: boolean; onSelect: OnSelect }> = ({
  membership,
  checked,
  onSelect,
}) => {
  const { t } = useLingui();
  const name = memberName(membership);
  return (
    <Checkbox
      aria-label={t`Select ${name}`}
      checked={checked}
      onChange={(event) => onSelect([membership.id], event.currentTarget.checked)}
    />
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

const MembershipRow = memo<ItemProps>(({ membership, plans, selected, onSelect, ...handlers }) => (
  <Table.Tr className={classes.row} data-selected={selected || undefined}>
    {onSelect && (
      <Table.Td w={40}>
        {selected !== undefined && <SelectBox membership={membership} checked={selected} onSelect={onSelect} />}
      </Table.Td>
    )}
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
      <Stack gap={6} align="flex-start">
        <StatusBadge membership={membership} />
        <Provenance membership={membership} />
      </Stack>
    </Table.Td>
    <Table.Td>
      <Actions membership={membership} {...handlers} />
    </Table.Td>
  </Table.Tr>
));

const MembershipCard = memo<ItemProps>(({ membership, plans, selected, onSelect, ...handlers }) => (
  <Card withBorder radius="lg" padding="md" className={classes.card} data-selected={selected || undefined}>
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
      <Group gap="sm" align="flex-start" wrap="nowrap" miw={0}>
        {onSelect && selected !== undefined && (
          <SelectBox membership={membership} checked={selected} onSelect={onSelect} />
        )}
        <Stack gap={2} miw={0}>
          <Text fw={700}>{memberName(membership)}</Text>
          <Account membership={membership} />
        </Stack>
      </Group>
      <StatusBadge membership={membership} />
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
    <Box mt="xs">
      <Provenance membership={membership} />
    </Box>
    <Divider my="sm" />
    <Actions membership={membership} {...handlers} />
  </Card>
));

type Props = Handlers & {
  memberships: readonly AdminMembership[];
  plans: ReadonlyMap<string, Plan>;
  requests: boolean;
  selection?: ReadonlySet<string>;
  onSelect?: OnSelect;
};

export const MembershipList: FC<Props> = ({ memberships, requests, selection, onSelect, ...rest }) => {
  const isMobile = useIsMobile();
  const selectedOf = (m: AdminMembership) => (onSelect && isUnpaid(m) ? (selection?.has(m.id) ?? false) : undefined);

  if (isMobile) {
    return (
      <Stack gap="sm">
        {memberships.map((m) => (
          <MembershipCard key={m.id} membership={m} selected={selectedOf(m)} onSelect={onSelect} {...rest} />
        ))}
      </Stack>
    );
  }

  return (
    <Table.ScrollContainer minWidth={TABLE_MIN_WIDTH}>
      <Table verticalSpacing="sm" highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {onSelect && (
              <Table.Th w={40}>
                <VisuallyHidden>
                  <Trans comment="Table column with checkboxes to pick memberships">Select</Trans>
                </VisuallyHidden>
              </Table.Th>
            )}
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
            <MembershipRow key={m.id} membership={m} selected={selectedOf(m)} onSelect={onSelect} {...rest} />
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
