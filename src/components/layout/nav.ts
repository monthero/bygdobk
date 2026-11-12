import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { CalendarBlank, ChatCircle, IdentificationCard, Newspaper, Shuffle, Trophy, UsersThree } from '~/components/ui';
import type { FileRouteTypes } from '~/routeTree.gen';

type NavItem = { to: FileRouteTypes['to']; label: MessageDescriptor; Icon: typeof ChatCircle };

export const NAV: readonly NavItem[] = [
  { to: '/trening', label: msg({ message: 'Training', comment: 'Main menu' }), Icon: CalendarBlank },
  { to: '/medlemskap', label: msg({ message: 'Membership', comment: 'Main menu' }), Icon: IdentificationCard },
  { to: '/arrangementer', label: msg({ message: 'Events', comment: 'Main menu' }), Icon: Trophy },
  {
    to: '/shuttlekaos',
    label: msg({ message: 'ShuttleKaos', comment: 'Main menu. Brand name of the social play tool, keep as is' }),
    Icon: Shuffle,
  },
  { to: '/nyheter', label: msg({ message: 'News', comment: 'Main menu' }), Icon: Newspaper },
  { to: '/klubben', label: msg({ message: 'The club', comment: 'Main menu' }), Icon: UsersThree },
];
