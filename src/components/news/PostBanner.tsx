import { memo } from 'react';

import type { NewsPost } from '~/cms/content';
import { SiteBanner, type SiteBannerProps } from '~/components/ui';
import { NEWS_BANNERS } from '~/data/news';

export const PostBanner = memo<SiteBannerProps & { post: NewsPost }>(({ post, ...props }) => (
  <SiteBanner {...props} banner={post.banner} slot={NEWS_BANNERS[post.kind]} />
));
