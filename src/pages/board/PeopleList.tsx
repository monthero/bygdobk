import { Trans, useLingui } from '@lingui/react/macro';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Collapse,
  Group,
  Stack,
  Table,
  Text,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { memo, type FC } from 'react';

import type { Plan } from '~/cms/content';
import { AVATAR_IMAGE_PROPS } from '~/components/auth';
import { CaretDown, CheckCircle, Clock, Plus } from '~/components/ui';
import { useIsMobile } from '~/hooks/useIsMobile';
import type { AdminMembership } from '~/memberships/model';
import { kr } from '~/pages/join/offers';

import { memberName, planName } from './format';
import { MembershipList } from './MembershipList';
import type { Person } from './people';

import classes from './PeopleList.module.css';

type Handlers = {
  onPay: (m: AdminMembership) => void;
  onEdit: (m: AdminMembership) => void;
  onDelete: (m: AdminMembership) => void;
  onDecline: (m: AdminMembership) => void;
  onAdd: (person: Person) => void;
};

type ItemProps = Handlers & { person: Person; plans: ReadonlyMap<string, Plan> };

const COLUMNS = 5;

const PersonName: FC<{ person: Person }> = ({ person: { name, profile } }) => (
  <Group gap="sm" wrap="nowrap" miw={0}>
    <Avatar
      src={profile?.avatarUrl}
      name={name}
      color={profile ? 'initials' : 'gray'}
      imageProps={AVATAR_IMAGE_PROPS}
      size="md"
    />
    <Stack gap={0} miw={0}>
      <Text fw={600} truncate>
        {name}
      </Text>
      <Text size="sm" c="dimmed" truncate>
        {profile ? profile.email : <Trans>No account</Trans>}
      </Text>
    </Stack>
  </Group>
);

const planSummary = (person: Person, plans: ReadonlyMap<string, Plan>) =>
  person.memberships
    .map((m) => {
      const plan = planName(plans, m.planId);
      return m.playerName === null || m.playerName === person.name ? plan : `${plan} (${memberName(m)})`;
    })
    .join(' · ');

const PersonStatus: FC<{ person: Person }> = ({ person }) => {
  const { unpaid, unpaidNok, requested, active } = person;
  if (active === 0 && requested === 0) {
    return (
      <Badge color="gray" variant="light">
        <Trans comment="Badge: this person has no membership in the chosen season">No membership</Trans>
      </Badge>
    );
  }
  return (
    <Group gap={6}>
      {active > 0 && unpaid === 0 && (
        <Badge color="green" variant="light" leftSection={<CheckCircle />}>
          <Trans comment="Badge: all of this person's memberships are paid">Paid</Trans>
        </Badge>
      )}
      {unpaid > 0 && (
        <Badge color="orange" variant="light" leftSection={<Clock />} className="tabular">
          <Trans comment="Badge: amount this person still owes">{kr(unpaidNok)} not paid</Trans>
        </Badge>
      )}
      {requested > 0 && (
        <Badge color="blue" variant="light" leftSection={<Clock />}>
          <Trans comment="Badge: membership requests from this person, waiting for the board">
            {requested} requested
          </Trans>
        </Badge>
      )}
    </Group>
  );
};

const AddButton: FC<{ person: Person; onAdd: (person: Person) => void }> = ({ person, onAdd }) => {
  const { t } = useLingui();
  const name = person.name;
  return (
    <Button
      size="compact-sm"
      variant="light"
      leftSection={<Plus />}
      aria-label={t`Add a membership for ${name}`}
      onClick={(event) => {
        event.stopPropagation();
        onAdd(person);
      }}
    >
      <Trans comment="Button: add a membership for this person">Add</Trans>
    </Button>
  );
};

const ExpandIcon: FC<{ opened: boolean }> = ({ opened }) => (
  <CaretDown className={classes.caret} data-opened={opened || undefined} aria-hidden />
);

const PersonRow = memo<ItemProps>(({ person, plans, onAdd, ...handlers }) => {
  const { t } = useLingui();
  const [opened, { toggle }] = useDisclosure(false);
  const hasMemberships = person.memberships.length > 0;
  const name = person.name;
  return (
    <>
      <Table.Tr
        className={classes.row}
        data-opened={opened || undefined}
        data-clickable={hasMemberships || undefined}
        onClick={hasMemberships ? toggle : undefined}
      >
        <Table.Td w={48}>
          {hasMemberships && (
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-expanded={opened}
              aria-label={opened ? t`Hide memberships for ${name}` : t`Show memberships for ${name}`}
              onClick={(event) => {
                event.stopPropagation();
                toggle();
              }}
            >
              <ExpandIcon opened={opened} />
            </ActionIcon>
          )}
        </Table.Td>
        <Table.Td maw={320}>
          <PersonName person={person} />
        </Table.Td>
        <Table.Td>
          <Text size="sm">{planSummary(person, plans)}</Text>
        </Table.Td>
        <Table.Td>
          <PersonStatus person={person} />
        </Table.Td>
        <Table.Td ta="end">
          <AddButton person={person} onAdd={onAdd} />
        </Table.Td>
      </Table.Tr>
      {opened && (
        <Table.Tr className={classes.details}>
          <Table.Td colSpan={COLUMNS}>
            <MembershipList memberships={person.memberships} plans={plans} requests={false} {...handlers} />
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
});

const PersonCard = memo<ItemProps>(({ person, plans, onAdd, ...handlers }) => {
  const [opened, { toggle }] = useDisclosure(false);
  const hasMemberships = person.memberships.length > 0;
  return (
    <Card withBorder radius="lg" padding="md" data-opened={opened || undefined}>
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <PersonName person={person} />
          <AddButton person={person} onAdd={onAdd} />
        </Group>
        <PersonStatus person={person} />
        {hasMemberships && (
          <>
            <UnstyledButton onClick={toggle} aria-expanded={opened} className={classes.cardToggle}>
              <Text size="sm" truncate>
                {planSummary(person, plans)}
              </Text>
              <ExpandIcon opened={opened} />
            </UnstyledButton>
            <Collapse expanded={opened}>
              <MembershipList memberships={person.memberships} plans={plans} requests={false} {...handlers} />
            </Collapse>
          </>
        )}
      </Stack>
    </Card>
  );
});

type Props = Handlers & { people: readonly Person[]; plans: ReadonlyMap<string, Plan> };

export const PeopleList: FC<Props> = ({ people, ...rest }) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Stack gap="sm">
        {people.map((person) => (
          <PersonCard key={person.key} person={person} {...rest} />
        ))}
      </Stack>
    );
  }

  return (
    <Table verticalSpacing="sm" highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <VisuallyHidden>
              <Trans>Show memberships</Trans>
            </VisuallyHidden>
          </Table.Th>
          <Table.Th>
            <Trans comment="Table column: a person, with their account email">Person</Trans>
          </Table.Th>
          <Table.Th>
            <Trans comment="Table column: the person's memberships this season">Memberships</Trans>
          </Table.Th>
          <Table.Th>
            <Trans comment="Table column: whether the person has paid">Status</Trans>
          </Table.Th>
          <Table.Th>
            <VisuallyHidden>
              <Trans>Actions</Trans>
            </VisuallyHidden>
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {people.map((person) => (
          <PersonRow key={person.key} person={person} {...rest} />
        ))}
      </Table.Tbody>
    </Table>
  );
};
