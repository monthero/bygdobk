import { useLingui } from '@lingui/react/macro';
import { Image, type ImageProps } from '@mantine/core';
import { memo } from 'react';

import type { NewsPost } from '~/cms/content';
import { CmsImage } from '~/components/ui';
import { NEWS_BANNERS } from '~/data/news';

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  post: NewsPost;
  sizes: string;
  aspect?: number;
  decorative?: boolean;
  priority?: boolean;
};

const FALLBACK_STYLE = { objectPosition: 'center bottom' };

export const PostBanner = memo<Props>(({ post, sizes, aspect, decorative = false, priority = false, ...props }) => {
  const { i18n } = useLingui();
  if (post.banner) {
    return (
      <CmsImage
        {...props}
        image={post.banner}
        sizes={sizes}
        aspect={aspect}
        decorative={decorative}
        priority={priority}
      />
    );
  }

  const photo = NEWS_BANNERS[post.kind];
  return (
    <Image
      {...props}
      src={photo.src}
      alt={decorative ? '' : i18n._(photo.alt)}
      style={FALLBACK_STYLE}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
    />
  );
});
