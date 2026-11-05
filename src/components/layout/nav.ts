import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { CalendarBlank, ChatCircle, IdentificationCard, Newspaper, Trophy, UsersThree } from '~/components/ui';
import type { FileRouteTypes } from '~/routeTree.gen';

type NavItem = { to: FileRouteTypes['to']; label: MessageDescriptor; Icon: typeof ChatCircle };

export const NAV: readonly NavItem[] = [
  { to: '/trening', label: msg({ message: 'Training', comment: 'Main menu' }), Icon: CalendarBlank },
  { to: '/medlemskap', label: msg({ message: 'Membership', comment: 'Main menu' }), Icon: IdentificationCard },
  { to: '/arrangementer', label: msg({ message: 'Events', comment: 'Main menu' }), Icon: Trophy },
  { to: '/nyheter', label: msg({ message: 'News', comment: 'Main menu' }), Icon: Newspaper },
  { to: '/klubben', label: msg({ message: 'The club', comment: 'Main menu' }), Icon: UsersThree },
  { to: '/kontakt', label: msg({ message: 'Contact', comment: 'Main menu' }), Icon: ChatCircle },
];
