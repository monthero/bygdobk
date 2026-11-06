import type { SanityImageSource } from '@sanity/image-url';

import { imageBuilder } from './client';

export const imageUrl = (image: SanityImageSource, width: number, aspect?: number) => {
  const sized = imageBuilder.image(image).width(width).auto('format');
  return aspect
    ? sized
        .height(Math.round(width / aspect))
        .fit('crop')
        .url()
    : sized.url();
};

export const hotspotPosition = (hotspot: { x: number; y: number } | undefined) =>
  hotspot ? `${hotspot.x * 100}% ${hotspot.y * 100}%` : 'center';
