import { useLingui } from '@lingui/react/macro';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import type { NewsPost } from '~/cms/content';
import { NEWS_KINDS } from '~/data/news';
import { date, formatDate, SHORT_DATE } from '~/utils/dates';

import { KIND_COLORS } from './kinds';
import { PostBanner } from './PostBanner';

import classes from './NewsList.module.css';

type Props = { posts: NewsPost[] };

export const NewsList = memo<Props>(({ posts }) => {
  const { i18n } = useLingui();
  return (
    <Stack gap={0} className={classes.list}>
      {posts.map((post) => (
        <Link key={post.slug} to="/nyheter/$slug" params={{ slug: post.slug }} className={classes.item}>
          <div className={classes.text}>
            <Group gap="sm" mb={4}>
              <Text size="sm" c="dimmed" className="tabular">
                {formatDate(date(post.date), SHORT_DATE)}
              </Text>
              <Badge size="sm" variant="light" color={KIND_COLORS[post.kind]}>
                {i18n._(NEWS_KINDS[post.kind])}
              </Badge>
            </Group>
            <Text fw={700} size="lg">
              {post.title}
            </Text>
            <Text c="dimmed" lineClamp={2}>
              {post.summary}
            </Text>
          </div>
          <PostBanner post={post} aspect={4 / 3} sizes="88px" decorative className={classes.thumb} />
        </Link>
      ))}
    </Stack>
  );
});
