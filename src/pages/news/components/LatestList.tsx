import { useLingui } from '@lingui/react/macro';
import { Badge, Paper, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import type { NewsPost } from '~/cms/content';
import { KIND_COLORS, PostBanner } from '~/components/news';
import { NEWS_KINDS } from '~/data/news';
import { date, formatDate, SHORT_DATE } from '~/utils/dates';

import classes from './LatestList.module.css';

export const LatestList = memo<{ posts: NewsPost[] }>(({ posts }) => {
  const { i18n } = useLingui();
  return (
    <Paper withBorder radius="lg" className={classes.panel}>
      {posts.map((post) => (
        <Link key={post.slug} to="/nyheter/$slug" params={{ slug: post.slug }} className={classes.row}>
          <Stack gap={6} align="flex-start" className={classes.text}>
            <Text size="xs" c="dimmed" className="tabular">
              {formatDate(date(post.date), SHORT_DATE)}
            </Text>
            <Text fw={700} lineClamp={2} className={classes.title}>
              {post.title}
            </Text>
            <Badge size="sm" variant="light" color={KIND_COLORS[post.kind]}>
              {i18n._(NEWS_KINDS[post.kind])}
            </Badge>
          </Stack>
          <PostBanner post={post} aspect={4 / 3} sizes="88px" decorative className={classes.thumb} />
        </Link>
      ))}
    </Paper>
  );
});
