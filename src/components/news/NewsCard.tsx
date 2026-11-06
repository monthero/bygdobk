import { useLingui } from '@lingui/react/macro';
import { AspectRatio, Badge, Card, Group, Highlight, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type FC } from 'react';

import type { NewsPost } from '~/cms/content';
import { NEWS_CARD_ASPECT, NEWS_KINDS } from '~/data/news';
import { date, formatDate, SHORT_DATE } from '~/utils/dates';

import { KIND_COLORS } from './kinds';
import { PostBanner } from './PostBanner';

import classes from './NewsCard.module.css';

export const NewsMeta: FC<{ post: NewsPost }> = ({ post }) => {
  const { i18n } = useLingui();
  return (
    <Group gap="sm">
      <Badge size="sm" variant="light" color={KIND_COLORS[post.kind]}>
        {i18n._(NEWS_KINDS[post.kind])}
      </Badge>
      <Text size="sm" c="dimmed" className="tabular">
        {formatDate(date(post.date), SHORT_DATE)}
      </Text>
    </Group>
  );
};

export const NewsCard = memo<{ post: NewsPost; highlight?: string[] }>(({ post, highlight }) => {
  return (
    <Card
      withBorder
      radius="lg"
      padding={0}
      className={classes.card}
      renderRoot={(props) => <Link {...props} to="/nyheter/$slug" params={{ slug: post.slug }} />}
    >
      <AspectRatio ratio={NEWS_CARD_ASPECT} className={classes.media}>
        <PostBanner
          post={post}
          aspect={NEWS_CARD_ASPECT}
          sizes="(min-width: 48em) 33vw, 100vw"
          decorative
          className={classes.image}
        />
      </AspectRatio>
      <Stack gap={8} p="md">
        <NewsMeta post={post} />
        <Title order={3} className={classes.title}>
          {highlight ? (
            <Highlight component="span" inherit highlight={highlight}>
              {post.title}
            </Highlight>
          ) : (
            post.title
          )}
        </Title>
        <Text size="sm" c="dimmed" lineClamp={2}>
          {post.summary}
        </Text>
      </Stack>
    </Card>
  );
});
