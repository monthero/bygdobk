import { useLingui } from '@lingui/react/macro';
import type { FC } from 'react';

import { PHOTOS } from '~/data/photos';

import classes from './VenuePhoto.module.css';

const PHOTO = PHOTOS.bygdohusOutside;

export const VenuePhoto: FC<{ fill?: boolean }> = ({ fill }) => {
  const { i18n } = useLingui();
  return (
    <div className={classes.photo} data-fill={fill || undefined}>
      <img src={PHOTO.src} alt={i18n._(PHOTO.alt)} loading="lazy" decoding="async" className={classes.image} />
    </div>
  );
};
