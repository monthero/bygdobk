import { Image, type ImageProps } from '@mantine/core';
import { memo, useMemo } from 'react';

import type { CmsImageData } from '~/cms/content';
import { hotspotPosition, imageUrl } from '~/cms/images';

const WIDTHS = [320, 640, 960, 1200, 1440, 2048];
const FALLBACK_WIDTH = 960;

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  image: CmsImageData;
  sizes: string;
  aspect?: number;
  decorative?: boolean;
  priority?: boolean;
};

export const CmsImage = memo<Props>(({ image, sizes, aspect, decorative = false, priority = false, ...props }) => {
  const { src, srcSet, style } = useMemo(() => {
    const position = hotspotPosition(image.hotspot);
    return {
      src: imageUrl(image, FALLBACK_WIDTH, aspect),
      srcSet: WIDTHS.map((w) => `${imageUrl(image, w, aspect)} ${w}w`).join(', '),
      style: {
        backgroundImage: image.lqip ? `url(${image.lqip})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: position,
        objectPosition: position,
      },
    };
  }, [image, aspect]);

  return (
    <Image
      {...props}
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={decorative ? '' : image.alt}
      style={style}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
    />
  );
});
