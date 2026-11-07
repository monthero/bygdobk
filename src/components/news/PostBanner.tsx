import { Image, type ImageProps } from '@mantine/core';
import { memo } from 'react';

import type { NewsPost } from '~/cms/content';
import { useSitePhoto } from '~/cms/siteData';
import { CmsImage } from '~/components/ui';
import { NEWS_BANNERS } from '~/data/news';

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  post: NewsPost;
  sizes: string;
  aspect?: number;
  decorative?: boolean;
  priority?: boolean;
};

const FALLBACK_POSITION = 'center bottom';

export const PostBanner = memo<Props>(({ post, sizes, aspect, decorative = false, priority = false, ...props }) => {
  const photo = useSitePhoto(NEWS_BANNERS[post.kind]);
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

  return (
    <Image
      {...props}
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      alt={decorative ? '' : photo.alt}
      style={{ objectPosition: photo.position ?? FALLBACK_POSITION }}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
    />
  );
});
