import { useLingui } from '@lingui/react/macro';
import { AspectRatio, Badge, Card, Group, Image, Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type FC } from 'react';

import { NEWS_KINDS, type NewsPost } from '~/data/news';
import { date, formatDate, SHORT_DATE } from '~/utils/dates';

import { KIND_COLORS } from './kinds';

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

export const NewsCard = memo<{ post: NewsPost }>(({ post }) => {
  const { i18n } = useLingui();
  return (
    <Card
      withBorder
      radius="lg"
      padding={0}
      className={classes.card}
      renderRoot={(props) => <Link {...props} to="/nyheter/$slug" params={{ slug: post.id }} />}
    >
      <AspectRatio ratio={16 / 9} className={classes.media}>
        <Image src={post.cover.src} alt="" className={classes.image} />
      </AspectRatio>
      <Stack gap={8} p="md">
        <NewsMeta post={post} />
        <Title order={3} className={classes.title}>
          {i18n._(post.title)}
        </Title>
        <Text size="sm" c="dimmed" lineClamp={2}>
          {i18n._(post.summary)}
        </Text>
      </Stack>
    </Card>
  );
});
