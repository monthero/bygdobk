import { Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { FC } from 'react';

import type { NewsPost } from '~/cms/content';
import { NewsMeta, PostBanner } from '~/components/news';
import { ArrowRight } from '~/components/ui';

import classes from './LeadStory.module.css';

export const LeadStory: FC<{ post: NewsPost }> = ({ post }) => {
  return (
    <Link to="/nyheter/$slug" params={{ slug: post.slug }} className={classes.lead}>
      <span className={classes.media} aria-hidden>
        <PostBanner post={post} sizes="(min-width: 62em) 66vw, 100vw" decorative priority className={classes.image} />
      </span>
      <Stack gap="sm" className={classes.body}>
        <NewsMeta post={post} />
        <Title order={2} className={classes.title}>
          {post.title}
        </Title>
        <Text className={classes.excerpt}>{post.summary}</Text>
        <ArrowRight className={classes.read} />
      </Stack>
    </Link>
  );
};
