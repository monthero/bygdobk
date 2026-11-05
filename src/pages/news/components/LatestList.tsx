import { useLingui } from '@lingui/react/macro';
import { Badge, Paper, Stack, Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import { KIND_COLORS } from '~/components/news';
import { NEWS_KINDS, type NewsPost } from '~/data/news';
import { date, formatDate, SHORT_DATE } from '~/utils/dates';

import classes from './LatestList.module.css';

export const LatestList = memo<{ posts: NewsPost[] }>(({ posts }) => {
  const { i18n } = useLingui();
  return (
    <Paper withBorder radius="lg" className={classes.panel}>
      {posts.map((post) => (
        <Link key={post.id} to="/nyheter/$slug" params={{ slug: post.id }} className={classes.row}>
          <Stack gap={6} align="flex-start" className={classes.text}>
            <Text size="xs" c="dimmed" className="tabular">
              {formatDate(date(post.date), SHORT_DATE)}
            </Text>
            <Text fw={700} lineClamp={2} className={classes.title}>
              {i18n._(post.title)}
            </Text>
            <Badge size="sm" variant="light" color={KIND_COLORS[post.kind]}>
              {i18n._(NEWS_KINDS[post.kind])}
            </Badge>
          </Stack>
          <img src={post.cover.src} alt="" className={classes.thumb} />
        </Link>
      ))}
    </Paper>
  );
});
