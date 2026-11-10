import { memo } from 'react';

import { SiteBanner, type SiteBannerProps } from '~/components/ui';
import { PhotoSlot } from '~/data/photos';

import type { VisitorEvent } from './eventMeta';

export const EventBanner = memo<SiteBannerProps & { event: VisitorEvent }>(({ event, ...props }) => (
  <SiteBanner {...props} banner={event.banner} slot={PhotoSlot.enum.events} />
));
