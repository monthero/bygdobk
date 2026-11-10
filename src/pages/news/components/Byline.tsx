import { useLingui } from '@lingui/react/macro';
import { Anchor, Avatar, Group, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC, ReactNode } from 'react';

import { useSiteContent, type BoardMember } from '~/cms/content';
import { imageUrl } from '~/cms/images';
import { BoardBadge, ClubLogo } from '~/components/ui';
import { NEWS_AUTHORS, NewsAuthor } from '~/data/news';

import classes from '../NewsPostPage.module.css';

const BOARD = NEWS_AUTHORS[NewsAuthor.enum.board];
const AVATAR_PX = 96;

const ClubAvatar: FC = () => (
  <Avatar size={48} radius="xl" variant="light" className={classes.avatar} aria-hidden>
    <ClubLogo mark height={30} />
  </Avatar>
);

const BoardLink: FC<{ children: ReactNode }> = ({ children }) => (
  <Anchor component={Link} to={BOARD.page} hash={BOARD.hash} fw={700} c="inherit">
    {children}
  </Anchor>
);

const Layout: FC<{ avatar: ReactNode; name: ReactNode; role: ReactNode }> = ({ avatar, name, role }) => (
  <Group gap="sm" wrap="nowrap">
    {avatar}
    <div>
      {name}
      <Text size="sm" c="dimmed">
        {role}
      </Text>
    </div>
  </Group>
);

const MemberByline: FC<{ member: BoardMember }> = ({ member }) => (
  <Layout
    avatar={<Avatar size={48} radius="xl" src={imageUrl(member.photo, AVATAR_PX, 1)} alt="" />}
    name={
      <BoardLink>
        {member.name}
        <BoardBadge />
      </BoardLink>
    }
    role={member.role}
  />
);

export const Byline: FC<{ author?: string }> = ({ author }) => {
  const { i18n } = useLingui();
  const { board } = useSiteContent();
  const member = author ? board.find((m) => m.name === author) : undefined;

  if (member) return <MemberByline member={member} />;
  if (author) return <Layout avatar={<ClubAvatar />} name={<Text fw={700}>{author}</Text>} role={i18n._(BOARD.role)} />;
  return (
    <Layout avatar={<ClubAvatar />} name={<BoardLink>{i18n._(BOARD.name)}</BoardLink>} role={i18n._(BOARD.role)} />
  );
};
