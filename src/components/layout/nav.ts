import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { CalendarBlank, ChatCircle, IdentificationCard, Newspaper, Shuttle, Trophy, UsersThree } from '~/components/ui';
import type { FileRouteTypes } from '~/routeTree.gen';

type NavItem = { to: FileRouteTypes['to']; label: MessageDescriptor; Icon: typeof ChatCircle; experimental?: boolean };

export const CLUB_NAV: readonly NavItem[] = [
  { to: '/trening', label: msg({ message: 'Training', comment: 'Main menu' }), Icon: CalendarBlank },
  { to: '/medlemskap', label: msg({ message: 'Membership', comment: 'Main menu' }), Icon: IdentificationCard },
  { to: '/arrangementer', label: msg({ message: 'Events', comment: 'Main menu' }), Icon: Trophy },
  { to: '/nyheter', label: msg({ message: 'News', comment: 'Main menu' }), Icon: Newspaper },
  { to: '/klubben', label: msg({ message: 'The club', comment: 'Main menu' }), Icon: UsersThree },
];

export const TOOL_NAV: readonly NavItem[] = [
  {
    to: '/shuttlekaos',
    label: msg({ message: 'ShuttleKaos', comment: 'Main menu. Brand name of the social play tool, keep as is' }),
    Icon: Shuttle,
    experimental: true,
  },
];

export const NAV: readonly NavItem[] = [...CLUB_NAV, ...TOOL_NAV];
