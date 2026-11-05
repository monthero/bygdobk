import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { memo, type FC, type ReactNode } from 'react';

import { ArrowLeft, ArrowRight } from '~/components/ui';
import type { NewsPost } from '~/data/news';

import classes from './PostPager.module.css';

const PagerLink: FC<{ post: NewsPost; label: ReactNode; newer?: boolean }> = ({ post, label, newer = false }) => {
  const { i18n } = useLingui();
  const Arrow = newer ? ArrowRight : ArrowLeft;
  return (
    <Link to="/nyheter/$slug" params={{ slug: post.id }} className={classes.link} data-newer={newer || undefined}>
      <Arrow className={classes.arrow} aria-hidden />
      <span className={classes.text}>
        <Text size="xs" fw={700} tt="uppercase" c="dimmed">
          {label}
        </Text>
        <Text fw={700} lineClamp={2} className={classes.title}>
          {i18n._(post.title)}
        </Text>
      </span>
    </Link>
  );
};

export const PostPager = memo<{ older?: NewsPost; newer?: NewsPost }>(({ older, newer }) => {
  const { t } = useLingui();
  if (!older && !newer) return null;
  return (
    <nav aria-label={t`Older and newer posts`} className={classes.pager}>
      {older && <PagerLink post={older} label={<Trans>Older post</Trans>} />}
      {newer && <PagerLink post={newer} label={<Trans>Newer post</Trans>} newer />}
    </nav>
  );
});
