import { Trans, useLingui } from '@lingui/react/macro';
import { ActionIcon, Anchor, Button, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { CSSProperties, FC, ReactNode } from 'react';

import { ArrowUpRight, Check, EnvelopeSimple, Handshake, Info, Phone, ShieldCheck } from '~/components/ui';
import { BOARD, CLUB, type BoardMember } from '~/data/club';

import classes from './sections.module.css';

const IconCard: FC<{ icon: ReactNode; color?: string; title: ReactNode; children: ReactNode }> = ({
  icon,
  color,
  title,
  children,
}) => (
  <Card withBorder radius="lg" padding="lg">
    <Group wrap="nowrap" align="flex-start">
      <ThemeIcon variant="light" color={color} size={40} radius="md">
        {icon}
      </ThemeIcon>
      <Stack gap={6}>
        <Title order={3}>{title}</Title>
        {children}
      </Stack>
    </Group>
  </Card>
);

const PHONE_GROUPS = /^(\d{3})(\d{2})(\d{3})$/;
const COPIED_MS = 1600;

const CopyAction: FC<{ value: string; label: string; done: string; icon: ReactNode }> = ({
  value,
  label,
  done,
  icon,
}) => {
  const clipboard = useClipboard({ timeout: COPIED_MS });
  const copy = () => {
    clipboard.copy(value);
    notifications.show({ message: done, icon: <Check />, color: 'teal', autoClose: COPIED_MS * 2 });
  };
  return (
    <ActionIcon
      size={38}
      radius="md"
      variant={clipboard.copied ? 'filled' : 'transparent'}
      color={clipboard.copied ? 'teal' : undefined}
      className={classes.copy}
      aria-label={label}
      onClick={copy}
    >
      {clipboard.copied ? <Check /> : icon}
    </ActionIcon>
  );
};

const BoardCard: FC<{ member: BoardMember }> = ({ member }) => {
  const { i18n, t } = useLingui();
  const firstName = member.name.split(' ').at(0) ?? member.name;
  return (
    <Card withBorder radius="lg" padding={0} className={classes.member}>
      <div className={classes.photo} style={{ '--photo': `url(${member.photo})` } as CSSProperties}>
        <div className={classes.caption}>
          <Text fw={700} lh={1.25} className={classes.name}>
            {member.name}
          </Text>
          <Text size="sm" lh={1.3} className={classes.role}>
            {i18n._(member.role)}
          </Text>
        </div>
        <div className={classes.contact}>
          {member.phone && (
            <CopyAction
              value={`+47 ${member.phone.replace(PHONE_GROUPS, '$1 $2 $3')}`}
              label={t`Copy phone number for ${member.name}`}
              done={t`${firstName}'s phone number was copied to the clipboard`}
              icon={<Phone />}
            />
          )}
          <CopyAction
            value={member.email}
            label={t`Copy email address for ${member.name}`}
            done={t`${firstName}'s email address was copied to the clipboard`}
            icon={<EnvelopeSimple />}
          />
        </div>
      </div>
    </Card>
  );
};

export const BoardSection: FC = () => (
  <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="md">
    {BOARD.map((member) => (
      <BoardCard key={member.name} member={member} />
    ))}
  </SimpleGrid>
);

export const SafetySection: FC = () => (
  <Card withBorder radius="lg" padding="lg">
    <Group wrap="nowrap" align="flex-start">
      <ThemeIcon variant="light" color="teal" size={40} radius="md">
        <ShieldCheck width={22} height={22} />
      </ThemeIcon>
      <Stack gap="sm" align="flex-start" maw={620}>
        <Text>
          <Trans>
            Has something happened in the club that isn’t okay? You can report it to the Norwegian sports federation,
            outside the club.
          </Trans>
        </Text>
        <Button
          component="a"
          href={CLUB.whistleblowingUrl}
          target="_blank"
          rel="noreferrer"
          variant="light"
          color="teal"
          rightSection={<ArrowUpRight />}
        >
          <Trans>Report to the sports federation</Trans>
        </Button>
        <Text size="sm" c="dimmed">
          <Trans>You can also talk to a board member you trust.</Trans>
        </Text>
      </Stack>
    </Group>
  </Card>
);

export const SponsorSection: FC<{ dealId: string }> = ({ dealId }) => (
  <IconCard icon={<Handshake width={22} height={22} />} title={<Trans>Sponsor the club</Trans>}>
    <Text c="dimmed">
      <Trans>Want to back badminton at Bygdøhus? We’d love to hear from you.</Trans>
    </Text>
    <Anchor href={`mailto:${CLUB.email}`}>
      <Trans>Email the board</Trans>
    </Anchor>
    <Text id={dealId} size="sm" c="dimmed" className={classes.deal}>
      <Trans>Member deal: Sport Modern gives members a discount. Ask the board for the club code.</Trans>
    </Text>
  </IconCard>
);

export const PrivacySection: FC = () => (
  <IconCard icon={<Info width={22} height={22} />} color="gray" title={<Trans>Your data</Trans>}>
    <Text c="dimmed">
      <Trans>Member data is stored in the sports federation’s member system.</Trans>
    </Text>
    <Anchor href={CLUB.privacyUrl} target="_blank" rel="noreferrer">
      <Trans>Platform terms</Trans> <ArrowUpRight />
    </Anchor>
  </IconCard>
);
