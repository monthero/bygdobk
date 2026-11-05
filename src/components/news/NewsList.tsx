import { useLingui } from '@lingui/react/macro';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import { NEWS_KINDS, type NewsPost } from '~/data/news';
import { date, formatDate, SHORT_DATE } from '~/utils/dates';

import { KIND_COLORS } from './kinds';

import classes from './NewsList.module.css';

type Props = { posts: NewsPost[] };

export const NewsList = memo<Props>(({ posts }) => {
  const { i18n } = useLingui();
  return (
    <Stack gap={0} className={classes.list}>
      {posts.map((post) => (
        <Link key={post.id} to="/nyheter/$slug" params={{ slug: post.id }} className={classes.item}>
          <Group gap="sm" mb={4}>
            <Text size="sm" c="dimmed" className="tabular">
              {formatDate(date(post.date), SHORT_DATE)}
            </Text>
            <Badge size="sm" variant="light" color={KIND_COLORS[post.kind]}>
              {i18n._(NEWS_KINDS[post.kind])}
            </Badge>
          </Group>
          <Text fw={700} size="lg">
            {i18n._(post.title)}
          </Text>
          <Text c="dimmed" lineClamp={2}>
            {i18n._(post.summary)}
          </Text>
        </Link>
      ))}
    </Stack>
  );
});
