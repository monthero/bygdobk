import { useLingui } from '@lingui/react/macro';
import { Stack, Text, Title } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import type { CSSProperties, FC } from 'react';

import { NewsMeta } from '~/components/news';
import { ArrowRight } from '~/components/ui';
import type { NewsPost } from '~/data/news';

import classes from './LeadStory.module.css';

export const LeadStory: FC<{ post: NewsPost }> = ({ post }) => {
  const { i18n } = useLingui();
  const style = { '--lead-photo': `url(${post.cover.src})` } as CSSProperties;
  return (
    <Link to="/nyheter/$slug" params={{ slug: post.id }} className={classes.lead} style={style}>
      <span className={classes.media} aria-hidden />
      <Stack gap="sm" className={classes.body}>
        <NewsMeta post={post} />
        <Title order={2} className={classes.title}>
          {i18n._(post.title)}
        </Title>
        <Text className={classes.excerpt}>{i18n._(post.summary)}</Text>
        <ArrowRight className={classes.read} />
      </Stack>
    </Link>
  );
};
