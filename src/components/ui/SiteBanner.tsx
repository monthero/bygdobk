import { Image, type ImageProps } from '@mantine/core';
import { memo } from 'react';

import type { CmsImageData } from '~/cms/content';
import { useSitePhoto } from '~/cms/siteData';
import type { PhotoSlot } from '~/data/photos';

import { CmsImage } from './CmsImage';

export type SiteBannerProps = Omit<ImageProps, 'src' | 'alt'> & {
  sizes: string;
  aspect?: number;
  decorative?: boolean;
  priority?: boolean;
};

type Props = SiteBannerProps & { banner: CmsImageData | undefined; slot: PhotoSlot };

const FALLBACK_POSITION = 'center bottom';

export const SiteBanner = memo<Props>(
  ({ banner, slot, sizes, aspect, decorative = false, priority = false, ...props }) => {
    const photo = useSitePhoto(slot);
    if (banner) {
      return (
        <CmsImage {...props} image={banner} sizes={sizes} aspect={aspect} decorative={decorative} priority={priority} />
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
  },
);
