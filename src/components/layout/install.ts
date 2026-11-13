import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { z } from 'zod';

import { AppKind } from '~/utils/apps';

export const InstallLook = z.enum(['link', 'button']);
export type InstallLook = z.infer<typeof InstallLook>;

export const INSTALL_TITLES: Record<AppKind, MessageDescriptor> = {
  [AppKind.enum.club]: msg`Add Bygdø BK to your Home Screen`,
  [AppKind.enum.shuttlekaos]: msg({
    message: 'Add ShuttleKaos to your Home Screen',
    comment: 'Title above the steps or button that add the ShuttleKaos app to the phone Home Screen',
  }),
};
