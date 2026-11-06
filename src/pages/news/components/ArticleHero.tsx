import { Trans, useLingui } from '@lingui/react/macro';
import { Button, Container, Group, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo } from 'react';

import type { NewsPost } from '~/cms/content';
import { KIND_COLORS, PostBanner } from '~/components/news';
import { ArrowLeft, PhotoBadge } from '~/components/ui';
import { NEWS_KINDS } from '~/data/news';
import { date, formatDate, LONG_DATE } from '~/utils/dates';

import classes from './ArticleHero.module.css';

export const ArticleHero = memo<{ post: NewsPost }>(({ post }) => {
  const { i18n } = useLingui();
  return (
    <header className={classes.hero}>
      <div className={classes.photo}>
        <PostBanner post={post} sizes="100vw" priority className={classes.image} />
      </div>
      <Container className={classes.inner}>
        <div className={classes.column}>
          <Button component={Link} to="/nyheter" variant="subtle" leftSection={<ArrowLeft />} className={classes.back}>
            <Trans>All news</Trans>
          </Button>
          <Group gap="sm" className={classes.meta}>
            <PhotoBadge color={KIND_COLORS[post.kind]} size="md">
              {i18n._(NEWS_KINDS[post.kind])}
            </PhotoBadge>
            <Text component="time" dateTime={post.date} fw={600} className="tabular">
              {formatDate(date(post.date), LONG_DATE)}
            </Text>
          </Group>
          <Title order={1} className={classes.title}>
            {post.title}
          </Title>
          <Text className={classes.lede}>{post.summary}</Text>
        </div>
      </Container>
    </header>
  );
});
