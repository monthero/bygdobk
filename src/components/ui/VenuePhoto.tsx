import type { CSSProperties, FC } from 'react';

import { PHOTOS } from '~/data/photos';

import classes from './VenuePhoto.module.css';

const PHOTO = PHOTOS.bygdohusOutside;
const STYLE = { '--venue-photo': `url(${PHOTO.src})` } as CSSProperties;

export const VenuePhoto: FC<{ fill?: boolean }> = ({ fill }) => (
  <div className={classes.photo} data-fill={fill || undefined} style={STYLE}></div>
);
