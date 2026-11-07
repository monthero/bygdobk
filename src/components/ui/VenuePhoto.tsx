import type { FC } from 'react';

import { useSitePhoto } from '~/cms/siteData';
import { PhotoSlot } from '~/data/photos';

import classes from './VenuePhoto.module.css';

export const VenuePhoto: FC<{ fill?: boolean }> = ({ fill }) => {
  const photo = useSitePhoto(PhotoSlot.enum.venue);
  return (
    <div className={classes.photo} data-fill={fill || undefined}>
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes="(min-width: 48em) 50vw, 100vw"
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className={classes.image}
        style={{ objectPosition: photo.position }}
      />
    </div>
  );
};
