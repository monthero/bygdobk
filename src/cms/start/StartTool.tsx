import { Box, Card, Container, Flex, Grid, Heading, Stack, Text } from '@sanity/ui';
import type { ComponentType, FC, MouseEventHandler, SVGProps } from 'react';
import { useIntentLink, useLink } from 'sanity/router';
import { z } from 'zod';

import {
  CalendarBlank,
  CalendarX,
  Coins,
  Handshake,
  IdentificationBadge,
  Images,
  Lifebuoy,
  Megaphone,
  Newspaper,
  Trophy,
  UsersThree,
  Wallet,
} from '~/components/ui/icons';
import { EventKind } from '~/data/events';
import { ADMIN_PATH } from '~/i18n/locales';

import { eventTemplateId, ListId, SINGLETONS, type SingletonId } from '../structure';

type Task = { title: string; hint: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

const TargetKind = z.enum(['create', 'edit', 'list', 'tool']);

type Target =
  | { kind: typeof TargetKind.enum.create; type: string; template?: string }
  | { kind: typeof TargetKind.enum.edit; id: SingletonId }
  | { kind: typeof TargetKind.enum.list; id: ListId }
  | { kind: typeof TargetKind.enum.tool; name: string };

type Section = { title: string; tasks: (Task & { target: Target })[] };

const SECTIONS: Section[] = [
  {
    title: 'Common jobs',
    tasks: [
      {
        title: 'Post news',
        hint: 'Write a news post for the front page and the news page.',
        icon: Newspaper,
        target: { kind: TargetKind.enum.create, type: 'newsPost' },
      },
      {
        title: 'Cancel training',
        hint: 'A holiday, or one evening with no training.',
        icon: CalendarX,
        target: { kind: TargetKind.enum.create, type: 'event', template: eventTemplateId(EventKind.enum.break) },
      },
      {
        title: 'Add an event',
        hint: 'A tournament, party, meeting or trip.',
        icon: Trophy,
        target: { kind: TargetKind.enum.create, type: 'event', template: eventTemplateId(EventKind.enum.tournament) },
      },
      {
        title: 'Show a notice',
        hint: 'A short message at the top of every page.',
        icon: Megaphone,
        target: { kind: TargetKind.enum.edit, id: 'notice' },
      },
    ],
  },
  {
    title: 'Keep up to date',
    tasks: [
      {
        title: 'Training times',
        hint: 'Days and times for each group, per season.',
        icon: CalendarBlank,
        target: { kind: TargetKind.enum.list, id: ListId.enum.trainingTimes },
      },
      {
        title: 'Training groups',
        hint: 'Texts, and whether a group takes new players.',
        icon: UsersThree,
        target: { kind: TargetKind.enum.list, id: ListId.enum.trainingGroups },
      },
      {
        title: 'Prices and plans',
        hint: 'Membership and training fees.',
        icon: Coins,
        target: { kind: TargetKind.enum.list, id: ListId.enum.membershipPlans },
      },
      {
        title: 'Payment',
        hint: 'Vipps number, account number and how to pay.',
        icon: Wallet,
        target: { kind: TargetKind.enum.edit, id: 'payment' },
      },
      {
        title: 'Board members',
        hint: 'Names, roles, photos and contact details.',
        icon: IdentificationBadge,
        target: { kind: TargetKind.enum.list, id: ListId.enum.boardMembers },
      },
      {
        title: 'Sponsors',
        hint: 'Logos in the partner strip and member deals.',
        icon: Handshake,
        target: { kind: TargetKind.enum.list, id: ListId.enum.sponsors },
      },
      {
        title: 'Photos',
        hint: 'The photos at the top of each page.',
        icon: Images,
        target: { kind: TargetKind.enum.edit, id: 'sitePhotos' },
      },
      {
        title: 'Help',
        hint: 'Short guides for everything here, in Norwegian and English.',
        icon: Lifebuoy,
        target: { kind: TargetKind.enum.tool, name: 'help' },
      },
    ],
  },
];

const ICON_SIZE = 28;
const ICON_BOX = { color: 'var(--card-accent-fg-color)', flex: 'none' } as const;

const TaskCardBody: FC<Task> = ({ title, hint, icon: Icon }) => (
  <Flex gap={3} align="flex-start">
    <Box style={ICON_BOX}>
      <Icon width={ICON_SIZE} height={ICON_SIZE} />
    </Box>
    <Stack gap={2}>
      <Text size={2} weight="semibold">
        {title}
      </Text>
      <Text size={1} muted>
        {hint}
      </Text>
    </Stack>
  </Flex>
);

type LinkProps = { href: string; onClick: MouseEventHandler<HTMLElement> };

const TaskCard: FC<Task & LinkProps> = ({ href, onClick, ...task }) => (
  <Card as="a" href={href} onClick={onClick} padding={4} radius={3} border shadow={1}>
    <TaskCardBody {...task} />
  </Card>
);

type Intent = typeof TargetKind.enum.create | typeof TargetKind.enum.edit;

const IntentTaskCard: FC<Task & { intent: Intent; params: Record<string, string> }> = ({ intent, params, ...task }) => (
  <TaskCard {...task} {...useIntentLink({ intent, params })} />
);

const PathTaskCard: FC<Task & { path: string }> = ({ path, ...task }) => {
  const href = `${ADMIN_PATH}/${path}`;
  const { onClick } = useLink({ href });
  return <TaskCard {...task} href={href} onClick={onClick} />;
};

const TargetCard: FC<Task & { target: Target }> = ({ target, ...task }) => {
  switch (target.kind) {
    case TargetKind.enum.create:
      return (
        <IntentTaskCard
          {...task}
          intent={TargetKind.enum.create}
          params={target.template ? { type: target.type, template: target.template } : { type: target.type }}
        />
      );
    case TargetKind.enum.edit:
      return (
        <IntentTaskCard
          {...task}
          intent={TargetKind.enum.edit}
          params={{ id: target.id, type: SINGLETONS[target.id].type }}
        />
      );
    case TargetKind.enum.list:
      return <PathTaskCard {...task} path={`structure/${target.id}`} />;
    case TargetKind.enum.tool:
      return <PathTaskCard {...task} path={target.name} />;
  }
};

export const StartTool: FC = () => (
  <Container width={2} paddingX={4} paddingY={[4, 5, 6]}>
    <Stack gap={5}>
      <Stack gap={3}>
        <Heading size={4}>What do you want to do?</Heading>
        <Text muted>Pick a job to go straight to it. Everything else is under “Content” at the top.</Text>
      </Stack>
      {SECTIONS.map((section) => (
        <Stack key={section.title} gap={3}>
          <Heading as="h2" size={1}>
            {section.title}
          </Heading>
          <Grid gridTemplateColumns={[1, 1, 2]} gap={3}>
            {section.tasks.map(({ target, ...task }) => (
              <TargetCard key={task.title} target={target} {...task} />
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  </Container>
);
